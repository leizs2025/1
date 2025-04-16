let fullData = [];
let selectedEntry = null;

window.searchPhone = function () {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return alert("请输入手机号关键字！");

  fetch(`https://lucky-cloud-f9c3.gealarm2012.workers.dev?search=${encodeURIComponent(keyword)}`)
    .then(res => res.text())
    .then(text => {
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        alert("查询失败：返回的不是有效 JSON");
        return;
      }

      if (!Array.isArray(data)) {
        alert("查询失败：格式错误（不是数组）");
        return;
      }

      fullData = data;
      const selector = document.getElementById("resultSelector");
      selector.innerHTML = "";

      if (data.length === 0) {
        selector.textContent = "未找到资料";
        return;
      }

      if (data.length === 1) {
        selectedEntry = data[0];
        renderForm();
      } else {
        const select = document.createElement("select");
        select.className = "form-select";
        select.onchange = () => {
          selectedEntry = data[select.selectedIndex];
          renderForm();
        };
        data.forEach(item => {
          const option = document.createElement("option");
          option.textContent = item.phoneNumber; // 👈 只显示手机号
          select.appendChild(option);
        });
        selector.appendChild(select);
      }
    })
    .catch(err => {
      alert("查询失败：" + err.message);
    });
};

window.startNewEntry = function () {
  selectedEntry = null;
  document.getElementById("adminForm").classList.remove("hidden");
  document.getElementById("serialNumber").value = "";
  document.getElementById("mainName").value = "";
  document.getElementById("phoneNumber").value = "";
  document.getElementById("phoneNumber").disabled = false;
  document.getElementById("receiptNumber").value = "";
  document.getElementById("receiptDate").value = "";
  document.getElementById("wishPaper").value = "";
  document.getElementById("wishReturnYes").checked = false;
  document.getElementById("wishReturnNo").checked = true;
  document.getElementById("offeringYes").checked = false;
  document.getElementById("offeringNo").checked = true;

  const container = document.getElementById("prayersContainer");
  container.innerHTML = "";
  container.appendChild(createPrayerBlock());
};

function renderForm() {
  document.getElementById("adminForm").classList.remove("hidden");

  document.getElementById("serialNumber").value = selectedEntry.serial || "";
  document.getElementById("mainName").value = selectedEntry.mainName;
  document.getElementById("phoneNumber").value = selectedEntry.phoneNumber;
  document.getElementById("phoneNumber").disabled = true;
  document.getElementById("receiptNumber").value = selectedEntry.receiptNumber || "";
  document.getElementById("receiptDate").value = selectedEntry.receiptDate || "";
  document.getElementById("wishPaper").value = selectedEntry.wishPaper || "";

  const wish = selectedEntry.wishReturn === "是" ? "Yes" : "No";
  document.getElementById("wishReturnYes").checked = wish === "Yes";
  document.getElementById("wishReturnNo").checked = wish === "No";

  const offer = selectedEntry.offering === "是" ? "Yes" : "No";
  document.getElementById("offeringYes").checked = offer === "Yes";
  document.getElementById("offeringNo").checked = offer === "No";

  const container = document.getElementById("prayersContainer");
  container.innerHTML = "";

  selectedEntry.data.forEach((item, i) => {
    container.appendChild(createPrayerBlock(item, i + 1));
  });
}

function createPrayerBlock(data = {}, index = 0) {
  const div = document.createElement("div");
  div.className = "card mb-2";
  div.style.position = "relative";
  div.innerHTML = `
    <div style="position:absolute; top:5px; right:10px; cursor:pointer; color:#900;" onclick="this.parentElement.remove(); checkMin()">❌</div>
    <div><strong>第 ${index} 位</strong></div>
    姓名: <input value="${data.name || ""}" class="form-control pName"/>
    生肖: <input value="${data.zodiac || ""}" class="form-control pZodiac"/>
    太岁: <input value="${data.taiSui || ""}" class="form-control pTaiSui"/>
    光明灯: <input value="${data.light || ""}" class="form-control pLight"/>
    长生禄位: <input value="${data.longevity || ""}" class="form-control pLongevity"/>
    文昌帝君: <input value="${data.wisdom || ""}" class="form-control pWisdom"/>
    十六罗汉: <input value="${data.arhat || ""}" class="form-control pArhat"/>
    纸金1: <input type="number" value="${data.paperGold1 || ""}" class="form-control pg1"/>
    纸金2: <input type="number" value="${data.paperGold2 || ""}" class="form-control pg2"/>
    纸金3: <input type="number" value="${data.paperGold3 || ""}" class="form-control pg3"/>
    纸金4: <input type="number" value="${data.paperGold4 || ""}" class="form-control pg4"/>
    纸金5: <input type="number" value="${data.paperGold5 || ""}" class="form-control pg5"/>
    安奉功德金: <input type="number" value="${data.donation || ""}" class="form-control donate"/>
  `;
  return div;
}

function checkMin() {
  const blocks = document.getElementById("prayersContainer").children;
  if (blocks.length === 0) {
    document.getElementById("prayersContainer").appendChild(createPrayerBlock());
  }
}

window.saveChanges = function () {
  const prayers = document.getElementById("prayersContainer").children;
  const updatedData = Array.from(prayers).map(div => ({
    name: div.querySelector(".pName").value,
    zodiac: div.querySelector(".pZodiac").value,
    taiSui: div.querySelector(".pTaiSui").value,
    light: div.querySelector(".pLight").value,
    longevity: div.querySelector(".pLongevity").value,
    wisdom: div.querySelector(".pWisdom").value,
    arhat: div.querySelector(".pArhat").value,
    paperGold1: +div.querySelector(".pg1").value || 0,
    paperGold2: +div.querySelector(".pg2").value || 0,
    paperGold3: +div.querySelector(".pg3").value || 0,
    paperGold4: +div.querySelector(".pg4").value || 0,
    paperGold5: +div.querySelector(".pg5").value || 0,
    donation: +div.querySelector(".donate").value || 0
  }));

  const method = selectedEntry ? "PUT" : "POST";
  const body = {
    method,
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    mainName: document.getElementById("mainName").value.trim(),
    data: updatedData,
    receiptNumber: document.getElementById("receiptNumber").value.trim(),
    receiptDate: document.getElementById("receiptDate").value.trim(),
    wishReturn: document.querySelector('input[name="wishReturn"]:checked')?.value || "",
    offering: document.querySelector('input[name="offering"]:checked')?.value || "",
    wishPaper: document.getElementById("wishPaper").value.trim(),
    admin: localStorage.getItem("admin") || "未登录"
  };

  fetch("https://lucky-cloud-f9c3.gealarm2012.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) alert("保存成功！");
      else alert("保存失败：" + result.message);
    });
};

window.deleteEntry = function () {
  if (!selectedEntry) return alert("请先查询一笔资料");
  const confirmDelete = confirm(`确定要删除手机号「${selectedEntry.phoneNumber}」的资料吗？⚠️ 此操作无法恢复！`);
  if (!confirmDelete) return;

  fetch("https://lucky-cloud-f9c3.gealarm2012.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "DELETE",
      phoneNumber: selectedEntry.phoneNumber
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert("✅ 删除成功！");
        document.getElementById("adminForm").classList.add("hidden");
        document.getElementById("resultSelector").innerHTML = "";
        document.getElementById("searchInput").value = "";
        selectedEntry = null;
      } else {
        alert("删除失败：" + result.message);
      }
    });
};

window.printEntry = function () {
  if (!selectedEntry) return alert("请先查出一笔资料");
  const win = window.open("form-print.html", "_blank");
  win.onload = () => {
    win.postMessage(JSON.stringify(selectedEntry), "*");
  };
};
