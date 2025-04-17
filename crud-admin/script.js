if (!localStorage.getItem("admin")) {
  alert("请先登录");
  window.location.href = "login.html";
}

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
        select.innerHTML = `<option selected disabled>请选择一笔资料</option>`;
        select.onchange = () => {
          const index = select.selectedIndex - 1;
          if (index >= 0) {
            selectedEntry = fullData[index];
            renderForm();
          }
        };
        data.forEach(item => {
          const option = document.createElement("option");
          option.textContent = item.phoneNumber;
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
  container.appendChild(createPrayerBlock({}, 1));
};

window.addPrayer = function () {
  const container = document.getElementById("prayersContainer");
  const currentCount = container.children.length;
  if (currentCount >= 15) {
    alert("最多只能新增 15 位祈福者！");
    return;
  }
  container.appendChild(createPrayerBlock({}, currentCount + 1));
};
function renderForm() {
  document.getElementById("adminForm").classList.remove("hidden");

  document.getElementById("serialNumber").value = selectedEntry.serial || "";
  document.getElementById("mainName").value = selectedEntry.mainName || "";
  document.getElementById("phoneNumber").value = selectedEntry.phoneNumber || "";
  document.getElementById("receiptNumber").value = selectedEntry.receiptNumber || "";
  document.getElementById("receiptDate").value = selectedEntry.receiptDate || "";
  document.getElementById("wishPaper").value = selectedEntry.wishPaper || "";

  // 还愿与供养
  document.getElementById("wishReturnYes").checked = selectedEntry.wishReturn === "是";
  document.getElementById("wishReturnNo").checked = selectedEntry.wishReturn !== "是";

  document.getElementById("offeringYes").checked = selectedEntry.offering === "是";
  document.getElementById("offeringNo").checked = selectedEntry.offering !== "是";

  // 祈福者资料
  const container = document.getElementById("prayersContainer");
  container.innerHTML = "";

  (selectedEntry.data || []).forEach((item, index) => {
    // 只渲染有姓名的卡片
    if (item.name && item.name.trim() !== "") {
      container.appendChild(createPrayerBlock(item, index + 1));
    }
  });

  // 若没有祈福者，至少显示一个空的
  if (container.children.length === 0) {
    container.appendChild(createPrayerBlock({}, 1));
  }
}


function createRadioGroup(name, className, checkedVal) {
  return `
    <div class="form-check form-check-inline">
      <input class="form-check-input ${className}" type="radio" name="${name}" value="是" ${checkedVal === "是" ? "checked" : ""}>
      <label class="form-check-label">是</label>
    </div>
    <div class="form-check form-check-inline">
      <input class="form-check-input ${className}" type="radio" name="${name}" value="" ${!checkedVal ? "checked" : ""}>
      <label class="form-check-label">否</label>
    </div>
  `;
}


function createPrayerBlock(data = {}, index = 1) {
  const div = document.createElement("div");
  div.className = "card mb-3 p-3";
  div.style.position = "relative";

  div.innerHTML = `
    <div style="position:absolute; top:5px; right:10px; cursor:pointer; color:#900;" onclick="this.parentElement.remove(); checkMin()">❌</div>
    <div class="mb-2"><strong>🧍‍♂️ 第 ${index} 位祈福者</strong></div>

    <div class="row">
      <div class="col-md-3">姓名 <input value="${data.name || ""}" class="form-control pName" /></div>
      <div class="col-md-3">生肖 <input value="${data.zodiac || ""}" class="form-control pZodiac" /></div>
    </div>

    <div class="row">
      <div class="col-md-2">太岁 ${createRadioGroup(`pTaiSui${index}`, "pTaiSui", data.taiSui)}</div>
      <div class="col-md-2">纸金1 <input type="number" value="${data.paperGold1 || ""}" class="form-control pg1" /></div>
      <div class="col-md-2">光明灯 ${createRadioGroup(`pLight${index}`, "pLight", data.light)}</div>
      <div class="col-md-2">纸金2 <input type="number" value="${data.paperGold2 || ""}" class="form-control pg2" /></div>
      <div class="col-md-2">长生禄位 ${createRadioGroup(`pLongevity${index}`, "pLongevity", data.longevity)}</div>
      <div class="col-md-2">纸金3 <input type="number" value="${data.paperGold3 || ""}" class="form-control pg3" /></div>
    </div>

    <div class="row">
      <div class="col-md-2">文昌帝君 ${createRadioGroup(`pWisdom${index}`, "pWisdom", data.wisdom)}</div>
      <div class="col-md-2">纸金4 <input type="number" value="${data.paperGold4 || ""}" class="form-control pg4" /></div>
      <div class="col-md-2">十六罗汉 ${createRadioGroup(`pArhat${index}`, "pArhat", data.arhat)}</div>
      <div class="col-md-2">纸金5 <input type="number" value="${data.paperGold5 || ""}" class="form-control pg5" /></div>
      <div class="col-md-4">安奉功德金 <input type="number" value="${data.donation || ""}" class="form-control donate" /></div>
    </div>
  `;

  return div;
}

function checkMin() {
  const blocks = document.getElementById("prayersContainer").children;
  if (blocks.length === 0) {
    document.getElementById("prayersContainer").appendChild(createPrayerBlock({}, 1));
  }
}


function actuallySave() {
  const prayers = document.getElementById("prayersContainer").children;
  const updatedData = Array.from(prayers).map(div => ({
    name: div.querySelector(".pName").value,
    zodiac: div.querySelector(".pZodiac").value,
    taiSui: div.querySelector('input.pTaiSui:checked')?.value || "",
    light: div.querySelector('input.pLight:checked')?.value || "",
    longevity: div.querySelector('input.pLongevity:checked')?.value || "",
    wisdom: div.querySelector('input.pWisdom:checked')?.value || "",
    arhat: div.querySelector('input.pArhat:checked')?.value || "",
    paperGold1: +div.querySelector(".pg1").value || 0,
    paperGold2: +div.querySelector(".pg2").value || 0,
    paperGold3: +div.querySelector(".pg3").value || 0,
    paperGold4: +div.querySelector(".pg4").value || 0,
    paperGold5: +div.querySelector(".pg5").value || 0,
    donation: +div.querySelector(".donate").value || 0
  }));

  const body = {
    method: selectedEntry ? "PUT" : "POST",
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
      if (result.success) {
        alert("✅ 保存成功！");
        startNewEntry(); // 清空表单回到新增模式
      } else {
        alert("❌ 保存失败：" + result.message);
      }
    });
}


window.deleteEntry = function () {
  if (!selectedEntry) {
    alert("⚠️ 请先查询一笔资料再删除！");
    return;
  }

  const confirmed = confirm(`确定要删除手机号「${selectedEntry.phoneNumber}」的资料吗？⚠️ 此操作无法恢复！`);
  if (!confirmed) return;

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
        // 清除界面
        selectedEntry = null;
        document.getElementById("adminForm").classList.add("hidden");
        document.getElementById("searchInput").value = "";
        document.getElementById("resultSelector").innerHTML = "";
      } else {
        alert("❌ 删除失败：" + result.message);
      }
    })
    .catch(err => {
      alert("❌ 删除请求出错：" + err.message);
    });
};


function getCurrentFormData() {
  const prayers = document.getElementById("prayersContainer").children;
  const updatedData = Array.from(prayers).map(div => ({
    name: div.querySelector(".pName").value,
    zodiac: div.querySelector(".pZodiac").value,
    taiSui: div.querySelector('input.pTaiSui:checked')?.value || "",
    light: div.querySelector('input.pLight:checked')?.value || "",
    longevity: div.querySelector('input.pLongevity:checked')?.value || "",
    wisdom: div.querySelector('input.pWisdom:checked')?.value || "",
    arhat: div.querySelector('input.pArhat:checked')?.value || "",
    paperGold1: +div.querySelector(".pg1").value || 0,
    paperGold2: +div.querySelector(".pg2").value || 0,
    paperGold3: +div.querySelector(".pg3").value || 0,
    paperGold4: +div.querySelector(".pg4").value || 0,
    paperGold5: +div.querySelector(".pg5").value || 0,
    donation: +div.querySelector(".donate").value || 0
  }));

  return {
    serial: document.getElementById("serialNumber").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    mainName: document.getElementById("mainName").value.trim(),
    receiptNumber: document.getElementById("receiptNumber").value.trim(),
    receiptDate: document.getElementById("receiptDate").value.trim(),
    wishReturn: document.querySelector('input[name="wishReturn"]:checked')?.value || "",
    offering: document.querySelector('input[name="offering"]:checked')?.value || "",
    wishPaper: document.getElementById("wishPaper").value.trim(),
    data: updatedData
  };
    const totalBox = document.getElementById("totalBox");
    const paperTotal = sum.pg1 + sum.pg2 + sum.pg3 + sum.pg4 + sum.pg5;
    const paperMoney = paperTotal * 3;
    const total = paperMoney + sum.donation;

    totalBox.innerHTML = `
      安奉功德金：RM ${sum.donation.toFixed(2)}<br/>
      真佛十四宝金：3.00 x ${paperTotal} 份 = RM ${paperMoney.toFixed(2)}<br/>
      总计：RM ${total.toFixed(2)}
    `;
}
window.printEntry = function () {
  if (!selectedEntry) return alert("请先查出一笔资料");

  const win = window.open("form-print.html", "_blank");

  const interval = setInterval(() => {
    if (win && win.document.readyState === "complete") {
      clearInterval(interval);
      win.postMessage(JSON.stringify(selectedEntry), "*");
    }
  }, 100);
};

