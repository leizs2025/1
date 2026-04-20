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
window.deleteEntry = function () {
  if (!selectedEntry) {
    alert("⚠️ 请先查询一笔资料再删除！");
    return;
  }

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
        document.getElementById("searchInput").value = "";
        document.getElementById("resultSelector").innerHTML = "";
        selectedEntry = null;
      } else {
        alert("❌ 删除失败：" + result.message);
      }
    })
    .catch(err => {
      alert("❌ 删除出错：" + err.message);
    });
};

function generateTempReceiptNumber() {
  const now = new Date();
  // 格式：YYYYMMDD
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); 

  const key = "globalTempReceiptCounter";
  
  // --- 修复核心逻辑 ---
  
  // 1. 获取原始数据
  let rawValue = localStorage.getItem(key);
  let currentSerial = 0;

  // 2. 安全地解析数字 (防止 NaN 错误)
  if (rawValue) {
      const parsed = parseInt(rawValue, 10);
      // 只有当解析结果是有效数字时，才使用它，否则归零
      if (!isNaN(parsed)) {
          currentSerial = parsed;
      }
  }

  // 3. 自增 (先加后用)
  currentSerial++;

  // 4. 同步写入 LocalStorage (确保下一次读取是最新的)
  // 注意：这里只存纯数字，不要存带前缀的字符串，方便计算
  try {
      localStorage.setItem(key, currentSerial.toString());
  } catch (e) {
      console.error("存储失败，可能是浏览器隐私模式或空间已满", e);
      // 降级策略：使用当前时间戳作为后备，防止报错
      return `TSR${datePart}-${Date.now().toString().slice(-4)}`;
  }

  // 5. 格式化输出 (不足4位补0)
  const serialPart = currentSerial.toString().padStart(4, "0");
  
  return `TSR${datePart}-${serialPart}`;
}
function resetTempReceiptCounter() {
  const confirmReset = confirm("⚠️ 确定要清除小票计数吗？这将重置所有临时收据号！");
  if (confirmReset) {
      localStorage.removeItem("globalTempReceiptCounter");
      alert("✅ 小票计数已清除！");
  }
}


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
window.saveChanges = function () {
  const phoneInput = document.getElementById("phoneNumber").value.trim();
  const mainName = document.getElementById("mainName").value.trim();

  if (!mainName || !phoneInput) {
      alert("主祈者姓名和电话都不能为空！");
      return;
  }

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

  // 确定是更新还是新增
  const isPhoneUpdated = selectedEntry && selectedEntry.phoneNumber !== phoneInput;
  const oldPhoneNumber = selectedEntry ? selectedEntry.phoneNumber : phoneInput;
  
  // --- 修改部分开始 ---
  // 删除了强制生成单号的代码。
  // 现在直接读取输入框的值，如果是空的，就传空字符串给后端。
  const currentReceiptNumber = document.getElementById("receiptNumber").value.trim();
  // --- 修改部分结束 ---

  const body = {
      method: "PUT",
      oldPhoneNumber: oldPhoneNumber, 
      phoneNumber: phoneInput,        
      mainName,
      data: updatedData,
      receiptNumber: currentReceiptNumber, // 这里可能是空的，允许提交
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
              alert("✅ 更新成功！");
              selectedEntry = null; 
              startNewEntry();      
          } else {
              alert("❌ 更新失败：" + result.message);
          }
      })
      .catch(err => {
          alert("❌ 更新出错：" + err.message);
      });
};



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


window.forceInsertNewEntry = function () {
  const newPhone = document.getElementById("phoneNumber").value.trim();
  if (!newPhone) return alert("请填写电话号码！");

  const exists = fullData.some(entry => entry.phoneNumber === newPhone);
  if (exists) {
    alert("❌ 该电话号码已存在，不能重复新增！");
    return;
  }

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

  // --- 修改部分开始 ---
  // 删除了强制生成单号的代码。
  // 允许 receiptNumber 为空，直接读取当前输入框的值（空的就传空的）
  const currentReceiptNumber = document.getElementById("receiptNumber").value.trim();
  // --- 修改部分结束 ---
    
  const body = {
    phoneNumber: newPhone,
    mainName: document.getElementById("mainName").value.trim(),
    data: updatedData,
    receiptNumber: currentReceiptNumber, // 允许为空
    receiptDate: document.getElementById("receiptDate").value.trim(),
    wishReturn: document.querySelector('input[name="wishReturn"]:checked')?.value || "",
    offering: document.querySelector('input[name="offering"]:checked')?.value || "",
    wishPaper: document.getElementById("wishPaper").value.trim(),
    admin: localStorage.getItem("admin") || "未登录",
    method: "POST"
  };

  fetch("https://lucky-cloud-f9c3.gealarm2012.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert("✅ 报名成功！待付款。"); // 提示语微调
        startNewEntry();
      } else {
        alert("❌ 报名失败：" + result.message);
      }
    });
};
function updateTotalBox() {
    const prayers = document.getElementById("prayersContainer").children;
    const sum = { pg1: 0, pg2: 0, pg3: 0, pg4: 0, pg5: 0, donation: 0 };
    
    Array.from(prayers).forEach(div => {
        sum.pg1 += +div.querySelector(".pg1").value || 0;
        sum.pg2 += +div.querySelector(".pg2").value || 0;
        sum.pg3 += +div.querySelector(".pg3").value || 0;
        sum.pg4 += +div.querySelector(".pg4").value || 0;
        sum.pg5 += +div.querySelector(".pg5").value || 0;
        sum.donation += +div.querySelector(".donate").value || 0;
    });

    const paperTotal = sum.pg1 + sum.pg2 + sum.pg3 + sum.pg4 + sum.pg5;
    const paperMoney = paperTotal * 3;
    const total = paperMoney + sum.donation;
    
    const totalBox = document.getElementById("totalBox");
    if(totalBox) { // 加个保护，防止元素不存在报错
        totalBox.innerHTML = `
         安奉功德金：RM ${sum.donation.toFixed(2)}<br/>
         真佛十四宝金：3.00 x ${paperTotal} 份 = RM ${paperMoney.toFixed(2)}<br/>
         总计：RM ${total.toFixed(2)}
        `;
    }
}

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

  // ✅ 直接返回数据，不要有多余代码
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
}
window.printEntry = function () {
  const currentData = getCurrentFormData(); // 获取当前表单中填写的数据

  const win = window.open("form-print.html", "_blank");

  const interval = setInterval(() => {
    if (win && win.document.readyState === "complete") {
      clearInterval(interval);
      win.postMessage(JSON.stringify(currentData), "*");
    }
  }, 100);
};

window.printTempReceipt = function () {
  const receiptInput = document.getElementById("receiptNumber");
  
  // --- 第一步：处理 Receipt No ---
  // 如果输入框是空的，就生成一个；如果有值，就直接使用。
  if (!receiptInput || !receiptInput.value.trim()) {
      const tempReceiptNumber = generateTempReceiptNumber();
      receiptInput.value = tempReceiptNumber;
      console.log("✅ 自动生成单号：" + tempReceiptNumber);
  } else {
      console.log("✅ 使用已有单号：" + receiptInput.value);
  }

  // --- 第二步：获取所有数据 ---
  const currentData = getCurrentFormData();

  // --- 第三步：智能检查（只检查核心数据） ---
  // 我们不检查 items (祈福者列表)，因为用户可能只打印表头。
  // 我们只检查最核心的：主祈者姓名 (mainName)
  if (!currentData || !currentData.mainName) {
      alert("请先填写【主祈者姓名】，否则小票无法打印！");
      return; // 只有没填名字时，才阻止打印
  }

  // --- 第四步：执行打印 ---
  // 既然有了单号（生成或已有），也有了名字，就可以打印了
  console.log("🖨️ 正在打开打印窗口...");
  
  const win = window.open("receipt-print.html", "_blank");
  
  if (!win) {
      alert("打印窗口被浏览器拦截，请允许弹窗！");
      return;
  }

  // 等待打印页面加载完成，然后发送数据
  const interval = setInterval(() => {
      if (win && win.document.readyState === "complete") {
          clearInterval(interval);
          win.postMessage(JSON.stringify(currentData), "*");
      }
  }, 100);
};
