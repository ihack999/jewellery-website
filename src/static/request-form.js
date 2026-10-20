// Custom request form: Netlify multipart submission (keeps the attached design image).
const form = document.querySelector("[data-custom-request]");
if (form) {
  const picker = form.querySelector("[data-file-picker]");
  const input = picker?.querySelector("input[type=file]");
  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    const name = picker.querySelector("[data-file-name]");
    if (file && name && !input.dataset.generatedDesignFile) name.textContent = file.name;
  });
  ["dragenter", "dragover"].forEach((t) => picker?.addEventListener(t, () => picker.classList.add("is-drag")));
  ["dragleave", "drop"].forEach((t) => picker?.addEventListener(t, () => picker.classList.remove("is-drag")));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!window.storeValidate?.(form)) return;
    // designer.js keeps the generated PNG on the form when the browser won't let it set input.files.
    if (form.__tjGeneratedDesignFile && input && !input.files?.length) {
      const data = new FormData(form);
      data.set("inspiration-upload", form.__tjGeneratedDesignFile);
      const res = await fetch(form.getAttribute("action") || "/", { method: "POST", body: data }).catch(() => null);
      return done(res?.ok);
    }
    done(await window.storeSubmitForm?.(form));
  });

  function done(ok) {
    const statusEl = form.querySelector("[data-form-status]");
    if (!ok) {
      if (statusEl) { statusEl.textContent = "Sorry, that didn't send. Please try again or email us directly."; statusEl.className = "form-status is-error"; }
      return;
    }
    form.hidden = true;
    const box = document.createElement("div");
    box.className = "form-done";
    box.innerHTML = `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      <h3 class="section-title" style="font-size:32px">Request received.</h3>
      <p class="muted">Thank you — we review every design personally and will reply with next steps, usually within one business day.</p>
      <a class="btn btn--ghost" href="/shop/">Browse the collection</a>`;
    form.after(box);
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
