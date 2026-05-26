# Realism Engine — Mathematical Framework

> Source: design spec authored by the project owner. This document is the
> reference the codebase upgrades against. Section numbers below are the
> ground truth — code comments and commits should cite them
> (e.g. `// §3 BRDF` or `// §5 contact penalty`).

## 1. The Full State Space

Define the generated design state as:

$$x = (G, M, L, C, B, A, P, H, R)$$

where:

- $G$ = geometry
- $M$ = material field
- $L$ = lighting environment
- $C$ = camera / AR tracking state
- $B$ = body or real-world surface
- $A$ = attachment / contact constraints
- $P$ = production / manufacturing variables
- $H$ = style / history / brand memory
- $R$ = regime constraints

A normal AI image generator outputs $I = f_\theta(p)$ where $p$ is the
prompt. The better system outputs $x = f_\theta(p, H)$ then renders
$I = R(x)$. The object exists **before** the image. This is the crucial
difference.

## 2. Geometry Math

Mesh $G = (V, F)$, vertices $v_i \in \mathbb{R}^3$, faces $f_j$.
Smooth surface form $X(u,v): \Omega \subset \mathbb{R}^2 \to \mathbb{R}^3$
with normals

$$n(u,v) = \frac{X_u \times X_v}{\|X_u \times X_v\|}.$$

Realism requires smoothness, thickness, curvature control, symmetry,
and contact logic.

**Thickness constraint** $\tau(x) \ge \tau_{\min}$ with penalty

$$E_{\text{thick}} = \int_G [\tau_{\min} - \tau(y)]_+^2 \, dy.$$

**Curvature constraint** $|\kappa(y)| \le \kappa_{\max}$ with penalty

$$E_{\text{curv}} = \int_G [|\kappa(y)| - \kappa_{\max}]_+^2 \, dy.$$

These prevent melted, warped, overly sharp, or impossible geometry.

## 3. Material Math

Per-point material state $M(y) = (\rho, r, m, \eta, T, a)$ — albedo,
roughness, metalness, IOR, transmission, absorption.

Rendering equation:

$$L_o(y, \omega_o) = L_e(y, \omega_o) + \int_\Omega f_r(y, \omega_i, \omega_o) L_i(y, \omega_i) (n \cdot \omega_i) \, d\omega_i$$

BRDF decomposition: $f_r = f_{\text{diff}} + f_{\text{spec}} + f_{\text{trans}}$.

Glossy metal microfacet specular:

$$f_{\text{spec}} = \frac{D(h) F(\omega_i, h) G(\omega_i, \omega_o)}{4 (n \cdot \omega_i)(n \cdot \omega_o)}, \quad h = \frac{\omega_i + \omega_o}{\|\omega_i + \omega_o\|}.$$

This is what makes polished metal look like polished metal instead of
plastic.

## 4. AR Camera & Pose Math

$u = \pi(K [R \mid t] X)$. Track
$T_{\text{world} \to \text{cam}}(t)$ and $T_{\text{obj} \to \text{world}}(t)$.

**Pose error**

$$E_{\text{pose}} = \sum_i \| u_i^{\text{obs}} - \pi(K T_t X_i) \|^2.$$

**Temporal jitter**

$$E_{\text{jitter}} = \sum_t \| T_t T_{t-1}^{-1} - I \|^2.$$

## 5. Contact & Fit Math

Signed distance $d_G(y, B)$. Object surface $G$, body $B$.

**Collision** $E_{\text{coll}} = \int_G [-d_G(y, B)]_+^2 \, dy$.

**Floating** $E_{\text{float}} = \int_A [d_G(y, B) - \epsilon]_+^2 \, dy$
over the intended contact region $A$.

Collision is punished, floating is punished, correct contact is rewarded.
One of the biggest realism upgrades — AI jewelry images often have pieces
floating above skin or melting into fingers/wrists/necks.

## 6. Regime Theory Formulation

$R = (X, C, U, \mu, \kappa, G)$.

Viable set $V = \{ x \in X : C_i(x) \le 0 \, \forall i \}$.
Generator proposes $\tilde{x}_{t+1} = U(x_t, p, H)$.
Regime engine checks $\tilde{x}_{t+1} \in V$. If yes, accept. If no,
correct via Gate-C: $x_{t+1} = G(\tilde{x}_{t+1})$.

$$\boxed{\, x_{t+1} = G(U(x_t, p, H)) \,}$$

## 7. Total Energy

$$E_{\text{total}} = w_g E_{\text{geo}} + w_m E_{\text{mat}} + w_l E_{\text{light}} + w_c E_{\text{contact}} + w_a E_{\text{AR}} + w_p E_{\text{prod}} + w_s E_{\text{style}} + w_n E_{\text{NoDrop}} + w_d E_{\Delta}$$

Component bundles:

- $E_{\text{geo}} = E_{\text{thick}} + E_{\text{curv}} + E_{\text{sym}} + E_{\text{smooth}} + E_{\text{topology}}$
- $E_{\text{mat}} = E_{\text{metal}} + E_{\text{gem}} + E_{\text{rough}} + E_{\text{refl}}$
- $E_{\text{light}} = E_{\text{shadow}} + E_{\text{highlight}} + E_{\text{env}}$
- $E_{\text{contact}} = E_{\text{coll}} + E_{\text{float}} + E_{\text{anchor}}$
- $E_{\text{AR}} = E_{\text{pose}} + E_{\text{jitter}} + E_{\text{occ}} + E_{\text{scale}}$
- $E_{\text{prod}} = E_{\text{mfg}} + E_{\text{dur}} + E_{\text{cost}}$
- $E_{\text{style}} = E_{\text{brand}} + E_{\text{coher}} + E_{\text{dist}}$

Solve $x^* = \arg\min_x E_{\text{total}}(x)$ subject to
$C_i(x) \le 0$, $h_j(x) = 0$.

## 8. NoDrop Math

Local realism error density $e(y; x) \ge 0$. Scale radii
$r_k = \theta^k r_0$, $0 < \theta < 1$. Local error at scale $r_k$:

$$E_k(q) = \frac{1}{|B_{r_k}(q)|} \int_{B_{r_k}(q)} e(y; x) \, dy.$$

**Scale drop** $D_k(q) = E_k(q) - E_{k+1}(q)$. NoDrop fires when
$D_k(q) \approx 0$ despite high $E_k(q)$.

$$\mathrm{ND}(q) = \sum_k \sigma\!\left(\frac{E_k(q) - \tau_k}{s}\right) \sigma\!\left(\frac{\epsilon E_k(q) - D_k(q)}{s}\right)$$

Global $\mathrm{ND}_{\text{global}} = \tau \log \sum_q e^{\mathrm{ND}(q)/\tau}$.
Penalty $E_{\text{NoDrop}} = \int \mathrm{ND}(q)^2 \, dq$.

"Find the fake-looking parts that stay fake no matter how closely you zoom in."

## 9. Gate-C Correction

$$x^* = \arg\min_y \left[ \|y - \tilde{x}\|_W^2 + \lambda_N E_{\text{NoDrop}}(y) + \sum_i \lambda_i [C_i(y)]_+^2 + \sum_j \gamma_j h_j(y)^2 \right]$$

Minimal correction — closest viable design to the proposal.
Gate-localized:
$x_{t+1} = x_t - \eta \int K(q, y) \nabla_x \mathrm{ND}(q) \, dq$
where $K$ tells the system which variables are responsible for the defect
at $q$.

## 10. Style Memory (HDWA-FSE)

Complex embedding $z_i = a_i e^{i \phi_i}$, design $z \in \mathbb{C}^n$,
brand memory $b \in \mathbb{C}^n$.

$$S_{\text{brand}}(z, b) = \frac{|\langle z, b \rangle|}{\|z\| \|b\|}, \quad E_{\text{brand}} = 1 - S_{\text{brand}}.$$

Collection coherence over prior pieces, distinctiveness penalty against
references.

## 11. Phase / Sparkle Math

Per microfacet $j$: $\psi_j = a_j e^{i \phi_j}$.
Observed sparkle $I_{\text{sparkle}} = \left| \sum_{j \in P} \psi_j \right|^2$.

Sparkle coherence
$C_{\text{sparkle}} = \frac{|\sum_j a_j e^{i \phi_j}|}{\sum_j a_j}$.

Dynamic scintillation target — neither too stable nor too chaotic.

## 12. Delta-Tile Math (AR Speed)

Tiles $T_i$, local state $x_i(t)$, update only if
$\|\Delta x_i\| > \eta_i$. Efficiency
$Q_\Delta = \frac{E(x_t) - E(x_{t+1})}{\alpha B + \beta O + \gamma M}$.
Maximize $Q_\Delta$.

## 13. Manufacturability

$$C_{\text{cost}} = p_m \rho_m V_m + \sum_s p_s q_s + p_f A_f + p_c K_c.$$

Stiffness $K(G) u = f$, stress $\sigma = C \varepsilon(u)$.
Durability penalty
$E_{\text{strength}} = \int_G [\sigma(y)/\sigma_{\text{yield}} - \rho_{\max}]_+^2 \, dy$.

## 14. Reality Score

$$S_{\text{real}}(x) = \exp(-E_{\text{real}}(x)) \in (0, 1].$$

Surface as `Reality Score = 100 S_real`.

## 15. Master Equation

$$\boxed{\, x^* = \arg\min_x \big[ w_g E_{\text{geo}} + w_m E_{\text{mat}} + w_l E_{\text{light}} + w_c E_{\text{contact}} + w_a E_{\text{AR}} + w_p E_{\text{prod}} + w_s E_{\text{style}} + w_n E_{\text{NoDrop}} + w_\Delta C_{\text{compute}} \big] \,}$$

subject to $C_i(x) \le 0$, $h_j(x) = 0$, corrected by
$x_{t+1} = G(U(x_t, p, H))$.

"Generate a design, render it, detect where it breaks reality, apply the
smallest correction, preserve brand style, preserve manufacturability,
and optimize it for AR speed."

## 16. Pipeline

1. Input $p$, retrieve $H$.
2. Propose $\tilde{x}_0 = U(p, H)$.
3. Render $I_0 = R(\tilde{x}_0)$.
4. Measure errors per channel.
5. NoDrop scan.
6. Gate-C correction.
7. Iterate until $E_{\text{total}} < \epsilon$ or
   $|S_{\text{real}}(x_t) - S_{\text{real}}(x_{t-1})| < \delta$.
8. Export $\{I, G, M, \text{AR}, \text{CAD}, S_{\text{real}}, C_{\text{cost}}, D_{\text{dur}}\}$.

## 17. Application Domains

AR try-on · product realism · jewelry design · manufacturability ·
material scoring · sparkle simulation · brand collection generation ·
mobile real-time · defect correction · CAD-to-render · prompt-to-3D ·
quality scoring · virtual photoshoots · personalised previews ·
luxury e-commerce visualization.

## 18. Why It Matters

Existing work maps directly:

| Component        | Role in engine                                  |
|------------------|-------------------------------------------------|
| Regime Theory    | legal design state space                        |
| NoDrop           | persistent realism defect detection             |
| Gate-C           | minimal correction operator                     |
| HDWA-FSE         | brand / style memory                            |
| Delta reasoning  | efficient AR update logic                       |
| Phase memory     | sparkle / reflection coherence                  |
| Multiscale PDE   | surface smoothness, curvature, flow, defects    |

A normal model asks "does it look good?"
This system asks "does it survive every layer of reality?"

---

## Repo Implementation Map (living document)

Track concrete code locations against the spec. Update as upgrades land.

| § | Concept           | Code location                                       | Status |
|---|-------------------|-----------------------------------------------------|--------|
| 2 | curved tapered prongs | [assets/js/designer.js](../assets/js/designer.js) `makeTaperedTube` / `addCurvedProng` | live |
| 2 | thickness penalty | [assets/js/designer.js](../assets/js/designer.js) `computeRealityEnergy::e_thickness` | live (score-only; geometry clamp TODO) |
| 3 | BRDF / metalness  | [assets/js/designer.js](../assets/js/designer.js) `materialForMetal` | live — anisotropy/sheen/iridescence per finish |
| 3 | UV anisotropy     | [assets/js/designer.js](../assets/js/designer.js) `makeBandGeometry` / `makeTaperedTube` | live — UVs follow surface flow |
| 3 | env reflections   | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)   | live — HDR PMREM + envMapIntensity=1.6 |
| 4 | AR pose           | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)   | live — One-Euro + scalar decomposition |
| 4 | AR jitter         | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)   | live — rAF lerp/slerp toward target |
| 5 | contact (shadow)  | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)   | live — soft shadow disc + finger occluder |
| 9 | Gate-C correction | [assets/js/designer.js](../assets/js/designer.js) `proposeGateCCorrection` | live — Fix button on score badge |
| 11| dispersion        | [assets/js/designer.js](../assets/js/designer.js) `materialForStone` | live — fire-driven dispersion + iridescence + env intensity |
| 11| micro-sparkle lights | [assets/js/designer.js](../assets/js/designer.js) `animateMicroSparkles` | live — 3 PointLights on Lissajous orbits |
| 11| sparkle (AR)      | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)   | partial — wandering point light only |
| 13| manufacturability | [assets/js/designer.js](../assets/js/designer.js) `computeManufacturability` | live — USD cost readout on badge |
| 14| reality score     | [assets/js/designer.js](../assets/js/designer.js) `computeRealityEnergy` / `updateRealityScore` | live — badge + tooltip + grade colours |
| 8 | NoDrop            | —                                                   | TODO — multi-scale defect scan |
| 10| brand memory (HDWA-FSE) | —                                             | TODO — collection coherence vector |
| 12| delta-tile compute | [assets/js/ar-tryon.js](../assets/js/ar-tryon.js)  | TODO — region-of-interest update budget |

Upgrade order agreed with project owner:

1. **Jewellery itself (designer.js)** — material BRDF realism (§3),
   geometry quality (§2), then sparkle (§11) and contact anchors (§5).
2. **AR** — pose / occlusion / contact polish (§4, §5, §12).
3. **Scoring** — Reality Score surfacing (§14).
