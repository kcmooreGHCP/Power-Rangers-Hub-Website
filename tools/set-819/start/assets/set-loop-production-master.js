(function () {
  "use strict";

  var shots = [
    {
      id: "C01",
      filename: "SL_C01_FRONT_DOOR.mp4",
      title: "One Front Door",
      finalDuration: 30,
      recordMinimum: 34,
      source: "./START_HERE.html",
      truth: "WORKING LOCAL",
      required: true,
      direction:
        "Begin on the clean Resource Center hero. Show exact store, exact work, then move once into the current work area. Keep technical index and admin sections off screen."
    },
    {
      id: "C02",
      filename: "SL_C02_FIELD_ROLE_VIEWS.mp4",
      title: "Field Connector + Role Views",
      finalDuration: 45,
      recordMinimum: 49,
      source: "./SET_LOOP_LEADERSHIP_DEMO.html",
      truth: "SHAREPOINT DEMO",
      required: true,
      direction:
        "Show Store, DM/RM, and Home Office as three lenses on the same floorset. Use prepared SharePoint demo links if available. Do not show add-link setup during the final recording."
    },
    {
      id: "C03",
      filename: "SL_C03_SET_OPERATIONS.mp4",
      title: "SET Operations Studio",
      finalDuration: 35,
      recordMinimum: 39,
      source: "./SET_OPERATIONS_STUDIO.html",
      truth: "WORKING LOCAL",
      required: true,
      direction:
        "Choose one store and one floorset once. Show calendar, source status, and workload context changing together. Do not open dense source tables unless the narration calls for them."
    },
    {
      id: "C04",
      filename: "SL_C04_BEAUTY_STUDIO.mp4",
      title: "Beauty Studio",
      finalDuration: 30,
      recordMinimum: 34,
      source: "./BEAUTY_STUDIO.html",
      truth: "WORKING LOCAL PILOT",
      required: true,
      direction:
        "Open one prepared Beauty launch. Show store context, fixture or movement direction, timing, and support in one understandable story."
    },
    {
      id: "C05",
      filename: "SL_C05_SET_IRL.mp4",
      title: "SET IRL",
      finalDuration: 35,
      recordMinimum: 39,
      source: "./SET_LOOP_LEADERSHIP_DEMO.html",
      truth: "DESIGNED NEXT",
      required: true,
      direction:
        "Use a clearly labeled designed-next motion sequence: capture proof, time, feedback, and one exception; then show that structured evidence returning to the admin review."
    },
    {
      id: "C06",
      filename: "SL_C06_FLOORSET_FACTORY.mp4",
      title: "Floorset Factory",
      finalDuration: 70,
      recordMinimum: 74,
      source: "./FLOORSET_FACTORY.html",
      truth: "WORKING LOCAL",
      required: true,
      direction:
        "Show the approved map, folder-based assets, a real fixture assembly, and one drag-to-fixture mapping. End on the visible next action. Use a completed prepared project; do not spend the recording waiting on intake."
    },
    {
      id: "C07",
      filename: "SL_C07_BG_RELEASE.mp4",
      title: "Populated Brand Guide + Release Gate",
      finalDuration: 50,
      recordMinimum: 54,
      source: "./FLOORSET_FACTORY.html#visual-qa",
      truth: "WORKING CONTROL",
      required: true,
      direction:
        "Start with a populated execution page—not a blank shell. Show expected, registered, placed, and approved evidence; then move from one amber exception to an already-prepared release-ready state."
    },
    {
      id: "C08",
      filename: "SL_C08_ENTERPRISE_CLOSE.mp4",
      title: "Enterprise Loop + Pilot Request",
      finalDuration: 35,
      recordMinimum: 39,
      source: "./SET_LOOP_ROLE_TAKEAWAYS.html",
      truth: "DESIGNED NEXT",
      required: true,
      direction:
        "Show Plan → Map → Build → Execute → Prove → Learn, then the three role lenses. End on the exact bounded ask: one owner-approved Beauty floorset in one approved test store."
    },
    {
      id: "OPT",
      filename: "SL_OPT_DRONE_CONTEXT.mp4",
      title: "Optional Drone Context",
      finalDuration: 12,
      recordMinimum: 16,
      source: "../00_CONTROL/RESOURCE_CENTER/VIDEO/SET_LOOP_DRONE_INTAKE_SPEC_V1_7.txt",
      truth: "AWAITING REVIEW",
      required: false,
      direction:
        "Reserved only. After the original, Copilot edit, script, and voiceover are reviewed, use this either as the cold open or as the physical-store bridge into SET IRL."
    }
  ];

  var timeline = [
    {
      start: "00:00",
      title: "One Front Door",
      duration: "00:30",
      truth: "Working local",
      visual: "Resource Center → exact store → exact work"
    },
    {
      start: "00:30",
      title: "Field Connector + Role Views",
      duration: "00:45",
      truth: "SharePoint demo",
      visual: "Store / DM-RM / Home Office"
    },
    {
      start: "01:15",
      title: "SET Operations Studio",
      duration: "00:35",
      truth: "Working local",
      visual: "Context, calendar, sources, workload"
    },
    {
      start: "01:50",
      title: "Beauty Studio",
      duration: "00:30",
      truth: "Working local pilot",
      visual: "One Beauty execution story"
    },
    {
      start: "02:20",
      title: "SET IRL",
      duration: "00:35",
      truth: "Designed next",
      visual: "Proof, time, feedback, exception"
    },
    {
      start: "02:55",
      title: "Floorset Factory",
      duration: "01:10",
      truth: "Working local",
      visual: "Map, folders, fixtures, image mapping"
    },
    {
      start: "04:05",
      title: "Brand Guide + Release Gate",
      duration: "00:50",
      truth: "Working control",
      visual: "Populated page, evidence, exception, clear gate"
    },
    {
      start: "04:55",
      title: "Enterprise Loop + Pilot Request",
      duration: "00:35",
      truth: "Designed next",
      visual: "Feedback loop and bounded decision"
    }
  ];

  var state = {
    files: {},
    filter: "all"
  };

  var elements = {};
  var toastTimer = 0;

  function query() {
    elements.tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
    elements.panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
    elements.input = document.querySelector("[data-recording-input]");
    elements.dropZone = document.querySelector("[data-drop-zone]");
    elements.progress = document.querySelector("[data-recording-progress]");
    elements.summary = document.querySelector("[data-recording-summary]");
    elements.shotList = document.querySelector("[data-shot-list]");
    elements.timelineBody = document.querySelector("[data-timeline-body]");
    elements.filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    elements.downloadCheck = document.querySelector("[data-download-check]");
    elements.clearCheck = document.querySelector("[data-clear-check]");
    elements.toast = document.querySelector("[data-toast]");
  }

  function setTab(name) {
    elements.tabs.forEach(function (tab) {
      var active = tab.getAttribute("data-tab") === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    elements.panels.forEach(function (panel) {
      var active = panel.getAttribute("data-panel") === name;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function basename(value) {
    return String(value || "")
      .replace(/\\/g, "/")
      .split("/")
      .pop();
  }

  function acceptedMedia(file) {
    return /\.(mp4|mov|webm)$/i.test(file.name || "");
  }

  function normalizeName(value) {
    return basename(value).toLowerCase();
  }

  function matchFiles(fileList) {
    state.files = {};
    Array.prototype.forEach.call(fileList || [], function (file) {
      var normalized = normalizeName(file.name);
      shots.forEach(function (shot) {
        if (normalized === shot.filename.toLowerCase()) {
          state.files[shot.id] = {
            name: file.name,
            size: file.size || 0,
            type: file.type || "",
            accepted: acceptedMedia(file),
            neutral: /\.(mp4|mov)$/i.test(file.name)
          };
        }
      });
    });
    renderShots();
    showToast("Recording folder checked.");
  }

  function shotStatus(shot) {
    var file = state.files[shot.id];
    if (!file) {
      return shot.required ? "missing" : "optional";
    }
    return file.accepted ? "ready" : "missing";
  }

  function shouldShow(shot) {
    if (state.filter === "all") {
      return true;
    }
    if (state.filter === "optional") {
      return !shot.required;
    }
    return shotStatus(shot) === state.filter;
  }

  function truthClass(value) {
    if (/working/i.test(value)) {
      return "local";
    }
    if (/sharepoint/i.test(value)) {
      return "demo";
    }
    return "next";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderShots() {
    var required = shots.filter(function (shot) {
      return shot.required;
    });
    var found = required.filter(function (shot) {
      return shotStatus(shot) === "ready";
    }).length;
    var percentage = (found / required.length) * 100;

    elements.progress.style.width = percentage + "%";
    elements.summary.textContent =
      found +
      " of " +
      required.length +
      " required chapter clips found." +
      (found === required.length
        ? " The media set is ready for an editor."
        : " Keep the exact filenames shown below.");

    elements.shotList.innerHTML = shots
      .filter(shouldShow)
      .map(function (shot) {
        var status = shotStatus(shot);
        var file = state.files[shot.id];
        var label =
          status === "ready"
            ? "Found"
            : status === "optional"
              ? "Optional"
              : "Missing";
        var note = "";
        if (file && !file.neutral) {
          note =
            '<p><strong>Format note:</strong> WebM works in Clipchamp but should be normalized to H.264 MP4 before Premiere.</p>';
        }
        return (
          '<article class="shot is-' +
          status +
          '">' +
          '<div class="shot-time">' +
          escapeHtml(String(shot.finalDuration)) +
          "s</div>" +
          "<div>" +
          '<span class="truth ' +
          truthClass(shot.truth) +
          '">' +
          escapeHtml(shot.truth) +
          "</span>" +
          "<h3>" +
          escapeHtml(shot.id + " · " + shot.title) +
          "</h3>" +
          "<p>" +
          escapeHtml(shot.direction) +
          "</p>" +
          '<span class="filename">' +
          escapeHtml(shot.filename) +
          "</span>" +
          '<p>Record at least ' +
          escapeHtml(String(shot.recordMinimum)) +
          " seconds so the edit keeps two seconds of clean handles at both ends.</p>" +
          note +
          '<div class="shot-actions">' +
          '<a class="mini-button" href="' +
          escapeHtml(shot.source) +
          '" target="_blank" rel="noopener">Open source</a>' +
          '<button class="mini-button" type="button" data-copy-filename="' +
          escapeHtml(shot.filename) +
          '">Copy filename</button>' +
          "</div>" +
          "</div>" +
          '<div class="shot-state"><strong>' +
          label +
          "</strong>" +
          (file ? "<small>" + escapeHtml(file.name) + "</small>" : "") +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    Array.prototype.slice
      .call(elements.shotList.querySelectorAll("[data-copy-filename]"))
      .forEach(function (button) {
        button.addEventListener("click", function () {
          copyText(button.getAttribute("data-copy-filename"), "Filename copied.");
        });
      });
  }

  function renderTimeline() {
    elements.timelineBody.innerHTML = timeline
      .map(function (row) {
        return (
          "<tr>" +
          "<td><strong>" +
          escapeHtml(row.start) +
          "</strong></td>" +
          "<td>" +
          escapeHtml(row.title) +
          "</td>" +
          "<td>" +
          escapeHtml(row.duration) +
          "</td>" +
          "<td>" +
          escapeHtml(row.truth) +
          "</td>" +
          "<td>" +
          escapeHtml(row.visual) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function copyText(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showToast(message);
        })
        .catch(function () {
          fallbackCopy(text, message);
        });
      return;
    }
    fallbackCopy(text, message);
  }

  function fallbackCopy(text, message) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast(message);
    } catch (error) {
      showToast("Copy was blocked by the browser.");
    }
    document.body.removeChild(textarea);
  }

  function mediaCheckCsv() {
    var lines = [
      [
        "chapter_id",
        "expected_filename",
        "required",
        "status",
        "found_filename",
        "neutral_format",
        "target_duration_seconds",
        "record_minimum_seconds"
      ].join(",")
    ];
    shots.forEach(function (shot) {
      var file = state.files[shot.id];
      lines.push(
        [
          shot.id,
          shot.filename,
          shot.required ? "YES" : "NO",
          shotStatus(shot).toUpperCase(),
          file ? file.name : "",
          file ? (file.neutral ? "YES" : "NO") : "",
          shot.finalDuration,
          shot.recordMinimum
        ]
          .map(function (value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
          })
          .join(",")
      );
    });
    return lines.join("\n");
  }

  function downloadText(filename, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 2600);
  }

  function readDirectoryEntries(reader) {
    return new Promise(function (resolve, reject) {
      var all = [];
      function readNext() {
        reader.readEntries(
          function (batch) {
            if (!batch.length) {
              resolve(all);
              return;
            }
            all = all.concat(Array.prototype.slice.call(batch));
            readNext();
          },
          reject
        );
      }
      readNext();
    });
  }

  function filesFromEntry(entry) {
    if (!entry) {
      return Promise.resolve([]);
    }
    if (entry.isFile) {
      return new Promise(function (resolve) {
        entry.file(
          function (file) {
            resolve([file]);
          },
          function () {
            resolve([]);
          }
        );
      });
    }
    if (entry.isDirectory) {
      return readDirectoryEntries(entry.createReader()).then(function (children) {
        return Promise.all(children.map(filesFromEntry)).then(function (groups) {
          return groups.reduce(function (all, group) {
            return all.concat(group);
          }, []);
        });
      });
    }
    return Promise.resolve([]);
  }

  function filesFromDrop(dataTransfer) {
    var items = Array.prototype.slice.call((dataTransfer && dataTransfer.items) || []);
    var entries = items
      .map(function (item) {
        return typeof item.webkitGetAsEntry === "function"
          ? item.webkitGetAsEntry()
          : null;
      })
      .filter(Boolean);

    if (!entries.length) {
      return Promise.resolve(
        Array.prototype.slice.call((dataTransfer && dataTransfer.files) || [])
      );
    }

    return Promise.all(entries.map(filesFromEntry)).then(function (groups) {
      return groups.reduce(function (all, group) {
        return all.concat(group);
      }, []);
    });
  }

  function bind() {
    elements.tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setTab(tab.getAttribute("data-tab"));
      });
    });

    elements.filters.forEach(function (filter) {
      filter.addEventListener("click", function () {
        state.filter = filter.getAttribute("data-filter");
        renderShots();
      });
    });

    elements.input.addEventListener("change", function () {
      matchFiles(elements.input.files);
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      elements.dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        elements.dropZone.classList.add("is-over");
      });
    });
    ["dragleave", "drop"].forEach(function (eventName) {
      elements.dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        elements.dropZone.classList.remove("is-over");
      });
    });
    elements.dropZone.addEventListener("drop", function (event) {
      filesFromDrop(event.dataTransfer)
        .then(matchFiles)
        .catch(function () {
          showToast("This browser could not read the dropped folder. Use Choose Folder.");
        });
    });

    elements.downloadCheck.addEventListener("click", function () {
      downloadText(
        "SET_LOOP_MEDIA_CHECK.csv",
        mediaCheckCsv(),
        "text/csv;charset=utf-8"
      );
      showToast("Media check downloaded.");
    });

    elements.clearCheck.addEventListener("click", function () {
      state.files = {};
      elements.input.value = "";
      renderShots();
      showToast("Recording check cleared.");
    });
  }

  function init() {
    query();
    bind();
    renderShots();
    renderTimeline();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
