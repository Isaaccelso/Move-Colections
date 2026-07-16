const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initializeNavigation() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-site-nav]");
  if (!toggle || !nav) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.dataset.open = String(open);
    document.body.classList.toggle("nav-open", open);
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
    }
  });
}

function initializeHeroTilt() {
  const surface = document.querySelector<HTMLElement>("[data-tilt]");
  if (!surface || reducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;

  surface.addEventListener("pointermove", (event) => {
    const rect = surface.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    surface.style.setProperty("--tilt-x", `${(-y * 2).toFixed(2)}deg`);
    surface.style.setProperty("--tilt-y", `${(x * 2).toFixed(2)}deg`);
    surface.style.setProperty("--shift-x", `${(x * 6).toFixed(2)}px`);
    surface.style.setProperty("--shift-y", `${(y * 6).toFixed(2)}px`);
  });

  surface.addEventListener("pointerleave", () => {
    surface.style.setProperty("--tilt-x", "0deg");
    surface.style.setProperty("--tilt-y", "0deg");
    surface.style.setProperty("--shift-x", "0px");
    surface.style.setProperty("--shift-y", "0px");
  });
}

function initializeQuoteForm() {
  const form = document.querySelector<HTMLFormElement>("[data-quote-form]");
  const button = form?.querySelector<HTMLButtonElement>("[data-submit-button]");
  const label = form?.querySelector<HTMLElement>("[data-submit-label]");
  const status = form?.querySelector<HTMLElement>("[data-form-status]");
  if (!form || !button || !label || !status) return;

  form.addEventListener("submit", (event) => {
    const itemsSelected = form.querySelectorAll<HTMLInputElement>('input[name="itemTypes"]:checked').length > 0;
    if (!itemsSelected) {
      event.preventDefault();
      status.textContent = "Selecione ao menos um tipo de item para continuar.";
      status.dataset.state = "error";
      form.querySelector<HTMLInputElement>('input[name="itemTypes"]')?.focus();
      return;
    }

    if (!form.checkValidity()) {
      event.preventDefault();
      status.textContent = "Revise os campos destacados antes de continuar.";
      status.dataset.state = "error";
      form.querySelector<HTMLElement>(":invalid")?.focus();
      form.reportValidity();
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    label.textContent = "Preparando sua conversa…";
    status.textContent = "O WhatsApp será aberto em uma nova aba. Se nada acontecer, permita pop-ups para este site.";
    status.dataset.state = "success";

    window.setTimeout(() => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      label.textContent = "Continuar no WhatsApp";
    }, 2_500);
  });
}

function initializeSectionFocus() {
  const protocol = document.querySelector<HTMLElement>("[data-protocol-track]");
  if (!protocol || reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      protocol.dataset.active = "true";
      observer.disconnect();
    },
    { threshold: 0.25 },
  );
  observer.observe(protocol);
}

initializeNavigation();
initializeHeroTilt();
initializeQuoteForm();
initializeSectionFocus();
