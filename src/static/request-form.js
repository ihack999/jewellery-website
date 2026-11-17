// Custom request form: Netlify multipart submission (keeps the attached design image).
const form = document.querySelector("[data-custom-request]");
if (form) {
  const picker = form.querySelector("[data-file-picker]");
  const input = picker?.querySelector("input[type=file]");
  const fileLabel = picker?.querySelector("[data-file-name]");
  const defaultFileLabel = fileLabel?.textContent;
  input?.addEventListener("change", () => {
    if (fileLabel && !input.dataset.generatedDesignFile) fileLabel.textContent = input.files?.[0]?.name || defaultFileLabel;
  });
  ["dragenter", "dragover"].forEach((t) => picker?.addEventListener(t, () => picker.classList.add("is-drag")));
  ["dragleave", "drop"].forEach((t) => picker?.addEventListener(t, () => picker.classList.remove("is-drag")));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!window.storeValidate?.(form)) return;
    // The editor keeps the PNG on the form when the browser won't let it set input.files.
    const generatedDesign = input?.files?.length ? null : form.__tjGeneratedDesignFile;
    if (await window.storeSubmitForm?.(form, generatedDesign)) done();
  });

  function done() {
    form.hidden = true;
    const box = document.createElement("div");
    box.className = "form-done";
    box.tabIndex = -1;
    box.innerHTML = `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      <h3 class="section-title" style="font-size:32px">Request received.</h3>
      <p class="muted">Thank you — we review every design personally and will reply with next steps, usually within one business day.</p>
      <a class="btn btn--ghost" href="/shop/">Browse the collection</a>`;
    form.after(box);
    box.focus();
  }
}
