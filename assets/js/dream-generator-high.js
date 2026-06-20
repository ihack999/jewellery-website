(function () {
  const renderMessages = [
    "Starting high-quality render",
    "Reading your specification",
    "Shaping the jewellery structure",
    "Setting the stones",
    "Balancing the prongs",
    "Lighting the studio",
    "Rendering high-quality detail"
  ];

  function getNamedFormValue(form, name) {
    const field = form?.elements?.[name];

    if (!field || !("value" in field)) {
      return "";
    }

    return field.value.trim();
  }

  function dreamDesignPayload(form) {
    return {
      pieceType: getNamedFormValue(form, "dream-piece-type"),
      metal: getNamedFormValue(form, "dream-metal"),
      stone: getNamedFormValue(form, "dream-stone"),
      style: getNamedFormValue(form, "dream-style"),
      budget: getNamedFormValue(form, "dream-budget"),
      customSpec: getNamedFormValue(form, "dream-custom-spec")
    };
  }

  function dataUrlFromBase64(base64, mimeType = "image/png") {
    if (/^data:/u.test(base64)) {
      return base64;
    }

    return `data:${mimeType};base64,${base64}`;
  }

  function dataUrlToFile(dataUrl, fileName) {
    const [header, body] = dataUrl.split(",");
    const mimeType = header.match(/^data:([^;]+);base64$/u)?.[1] || "image/png";
    const binary = window.atob(body);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], fileName, { type: mimeType });
  }

  async function dreamImageFileFromResponse(result) {
    const fileName = `dream-design-${Date.now()}.png`;

    if (result.imageBase64) {
      const dataUrl = dataUrlFromBase64(result.imageBase64, result.mimeType || "image/png");
      return {
        file: dataUrlToFile(dataUrl, fileName),
        src: dataUrl
      };
    }

    if (result.imageUrl) {
      const response = await fetch(result.imageUrl);

      if (!response.ok) {
        throw new Error("Generated image could not be downloaded");
      }

      const blob = await response.blob();
      return {
        file: new File([blob], fileName, { type: blob.type || "image/png" }),
        src: URL.createObjectURL(blob)
      };
    }

    throw new Error("The generator did not return an image");
  }

  function appendDreamFormValues(formData, leadForm, designForm, result, imageFile) {
    const values = {
      "dream-name": getNamedFormValue(leadForm, "dream-name"),
      "dream-email": getNamedFormValue(leadForm, "dream-email"),
      "dream-phone": getNamedFormValue(leadForm, "dream-phone"),
      "dream-piece-type": getNamedFormValue(designForm, "dream-piece-type"),
      "dream-metal": getNamedFormValue(designForm, "dream-metal"),
      "dream-stone": getNamedFormValue(designForm, "dream-stone"),
      "dream-style": getNamedFormValue(designForm, "dream-style"),
      "dream-budget": getNamedFormValue(designForm, "dream-budget"),
      "dream-custom-spec": getNamedFormValue(designForm, "dream-custom-spec"),
      "dream-prompt": result.prompt || "",
      "dream-negative-prompt": result.negativePrompt || ""
    };

    Object.entries(values).forEach(([name, value]) => {
      formData.set(name, value);
    });

    formData.set("generated-image", imageFile, imageFile.name);
  }

  async function postNetlifyFormData(formData) {
    const response = await fetch("/", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Netlify form submission failed");
    }
  }

  function setDreamBusyState(root, busy) {
    root.classList.toggle("is-generating", busy);
    root.querySelectorAll("[data-dream-lead-submit], [data-dream-generate-submit], [data-dream-retry]").forEach((button) => {
      button.disabled = busy;
    });
  }

  function startRenderLoop(statusNode) {
    let index = 0;

    if (statusNode) {
      statusNode.textContent = renderMessages[index];
    }

    return window.setInterval(() => {
      index = (index + 1) % renderMessages.length;

      if (statusNode) {
        statusNode.textContent = renderMessages[index];
      }
    }, 1500);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function readJson(response) {
    return response.json().catch(() => ({}));
  }

  async function pollHighQualityImage(startResult, renderStatus) {
    if (!startResult.responseId) {
      return startResult;
    }

    const basePollUrl = startResult.pollUrl || `/.netlify/functions/generate-dream-design-status?id=${encodeURIComponent(startResult.responseId)}`;
    const maxAttempts = 65;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await wait(attempt === 0 ? 1600 : 3000);

      const separator = basePollUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${basePollUrl}${separator}t=${Date.now()}`, {
        headers: { Accept: "application/json" }
      });
      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(result.details || result.message || "The high-quality image could not finish rendering.");
      }

      if (result.imageBase64 || result.imageUrl) {
        return {
          ...startResult,
          ...result
        };
      }

      if (renderStatus) {
        const label = attempt < 10
          ? "High-quality render in progress"
          : "Still rendering the high-quality image";
        renderStatus.textContent = `${label}${".".repeat((attempt % 3) + 1)}`;
      }
    }

    throw new Error("The high-quality image is still rendering. Please try again in a moment.");
  }

  function setupHighQualityDreamGenerator() {
    const root = document.querySelector("[data-dream-generator]");

    if (!root || root.dataset.highQualityGeneratorReady === "true") {
      return;
    }

    root.dataset.highQualityGeneratorReady = "true";

    const leadForm = root.querySelector("[data-dream-lead-form]");
    const designForm = root.querySelector("[data-dream-design-form]");
    const resultForm = document.querySelector("[data-dream-result-form]");
    const generateButton = root.querySelector("[data-dream-generate-submit]");
    const retryButton = root.querySelector("[data-dream-retry]");
    const designStatus = root.querySelector("[data-dream-design-status]");
    const renderStatus = root.querySelector("[data-dream-render-status]");
    const resultTitle = root.querySelector("[data-dream-result-title]");
    const resultCopy = root.querySelector("[data-dream-result-copy]");
    const resultImage = root.querySelector("[data-dream-result-image]");

    if (!leadForm || !designForm || !resultForm) {
      return;
    }

    designForm.addEventListener("submit", async (event) => {
      if (!root.classList.contains("is-contact-saved")) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!designForm.reportValidity()) {
        return;
      }

      let renderLoop = null;

      setDreamBusyState(root, true);

      if (retryButton) {
        retryButton.hidden = true;
      }

      if (generateButton) {
        generateButton.textContent = "Generating high-quality image...";
      }

      if (designStatus) {
        designStatus.textContent = "Generating your high-quality design image...";
      }

      if (resultTitle) {
        resultTitle.textContent = "Rendering your concept";
      }

      if (resultCopy) {
        resultCopy.textContent = "This high-quality render can take longer, but it will stay on this page until the image is ready.";
      }

      renderLoop = startRenderLoop(renderStatus);

      try {
        const generationResponse = await fetch("/.netlify/functions/generate-dream-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dreamDesignPayload(designForm))
        });
        const generationStart = await readJson(generationResponse);

        if (!generationResponse.ok && generationResponse.status !== 202) {
          throw new Error(generationStart.details || generationStart.message || "The image could not be generated yet.");
        }

        const generationResult = await pollHighQualityImage(generationStart, renderStatus);
        const imageResult = await dreamImageFileFromResponse(generationResult);

        if (resultImage) {
          resultImage.src = imageResult.src;
          resultImage.alt = "Generated custom jewellery design";
        }

        const resultFormData = new FormData(resultForm);
        appendDreamFormValues(resultFormData, leadForm, designForm, generationResult, imageResult.file);
        await postNetlifyFormData(resultFormData);

        if (renderStatus) {
          renderStatus.textContent = "Design sent";
        }

        if (designStatus) {
          designStatus.textContent = "High-quality design generated and sent. We will follow up soon.";
        }

        if (resultTitle) {
          resultTitle.textContent = "Your dream design is sent";
        }

        if (resultCopy) {
          resultCopy.textContent = "The high-quality generated image, prompt, and your details were sent with your request.";
        }
      } catch (error) {
        if (retryButton) {
          retryButton.hidden = false;
        }

        if (renderStatus) {
          renderStatus.textContent = "Generator needs attention";
        }

        if (designStatus) {
          designStatus.textContent = error.message || "Generation failed. Please try again.";
        }

        if (resultTitle) {
          resultTitle.textContent = "The image did not generate";
        }

        if (resultCopy) {
          resultCopy.textContent = "Your contact details are still saved. Try again once the generator is connected.";
        }
      } finally {
        if (renderLoop) {
          window.clearInterval(renderLoop);
        }

        setDreamBusyState(root, false);

        if (generateButton) {
          generateButton.textContent = "Generate + Send Design";
        }
      }
    }, true);
  }

  document.addEventListener("DOMContentLoaded", setupHighQualityDreamGenerator);
})();
