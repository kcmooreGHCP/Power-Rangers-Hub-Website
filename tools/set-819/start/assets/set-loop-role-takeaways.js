(function () {
  "use strict";

  var buttons = Array.prototype.slice.call(
    document.querySelectorAll("[data-role-button]")
  );
  var details = Array.prototype.slice.call(
    document.querySelectorAll("[data-role-detail]")
  );

  function selectRole(role) {
    buttons.forEach(function (button) {
      var active = button.getAttribute("data-role-button") === role;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    details.forEach(function (detail) {
      var active = detail.getAttribute("data-role-detail") === role;
      detail.classList.toggle("is-active", active);
      detail.hidden = !active;
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectRole(button.getAttribute("data-role-button"));
    });
  });

  selectRole("store-team");
})();
