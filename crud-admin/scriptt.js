if (!localStorage.getItem("admin")) {
  alert("请先登录");
  window.location.href = "login.html";
}

let fullData = [];
let selectedEntry = null;

window.searchPhone = async function () {
  const keyword = document.getElementById("searchInput").value.trim();
  const workerUrl = document.getElementById("workerSelector").value;
  
  if (!keyword) return alert("请输入手机号关键字！");
  if (!workerUrl) return alert("请选择要使用的Worker！");
  
  // 根据选择决定查询哪些Worker
  let urlsToQuery = [];
  
  if (workerUrl === "all") {
    // 查询所有Worker
    urlsToQuery = [
      'https://lucky-cloud-f9c3.gealarm2012.workers.dev',
      'https://userts.gealarm2012.workers.dev'  // 替换为你的实际Worker URL
    ];
  } else {
    // 只查询选中的Worker
    urlsToQuery = [workerUrl];
  }

  try {
    let combinedData = [];
    
    if (urlsToQuery.length === 1) {
      // 单个Worker查询
      const response = await fetch(`${urlsToQuery[0]}?search=${encodeURIComponent(keyword)}`);
      const text = await response.text();
      
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
      
      combinedData = data;
    } else {
      // 多个Worker并发查询
      const promises = urlsToQuery.map(url => 
        fetch(`${url}?search=${encodeURIComponent(keyword)}`)
          .then(res => res.text())
          .then(text => {
            try {
              return JSON.parse(text);
            } catch (e) {
              console.error(`Worker ${url} 返回无效JSON`, e);
              return [];
            }
          })
          .catch(err => {
            console.error(`Worker ${url} 查询失败`, err);
            return [];
          })
      );
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (Array.isArray(result)) {
          combinedData = combinedData.concat(result);
        }
      });
    }

    // 原有的结果处理逻辑
    fullData = combinedData;
    const selector = document.getElementById("resultSelector");
    selector.innerHTML = "";

    if (combinedData.length === 0) {
      selector.textContent = "未找到资料";
      return;
    }

    if (combinedData.length === 1) {
      selectedEntry = combinedData[0];
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
      combinedData.forEach(item => {
        const option = document.createElement("option");
        option.textContent = item.phoneNumber;
        select.appendChild(option);
      });
      selector.appendChild(select);
    }
  } catch (err) {
    alert("查询失败：" + err.message);
  }
};
function generateTempReceiptNumber() {
  const now = new Date();
  // 格式：YYYYMMDD
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); 

  const key = "TS_globalTempReceiptCounter";
  
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


async function forceInsertNewEntry() {
  try {
    const receiptNumber = document.getElementById("receiptNumber").value.trim();
    const receiptDate = document.getElementById("receiptDate").value.trim();
    const mainName = document.getElementById("mainName").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();

    // 获取所有复选框的状态
    const checkboxes = {};
    const checkboxElements = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxElements.forEach(checkbox => {
      const name = checkbox.name;
      if (name && name !== "selectAll") {
        checkboxes[name] = checkbox.checked;
      }
    });

    // 检查收据号是否已存在
    const existingRes = await fetch('https://lucky-cloud-f9c3.gealarm2012.workers.dev', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: "GET",
        receiptNumber: receiptNumber
      })
    });
    
    const existingResult = await existingRes.json();
    
    if (existingResult.success && existingResult.data) {
      alert(`收据号 ${receiptNumber} 已存在于管理数据库中，正在替换...`);
      console.log("找到现有记录:", existingResult.data);
    }

    // 构建更新后的数据
    const updatedData = {
      receiptNumber: receiptNumber,
      receiptDate: receiptDate,
      mainName: mainName,
      phone: phoneInput,
      ...checkboxes
    };

    // 1. 保存到管理端Worker
    const body = {
      phoneNumber: phoneInput, // 使用输入的电话号码作为主键
      mainName: mainName,
      data: updatedData,
      receiptNumber: receiptNumber,
      receiptDate: receiptDate,
      mainName: mainName,
      ...checkboxes
    };

    console.log("发送到管理端的数据:", body);

    const res = await fetch('https://lucky-cloud-f9c3.gealarm2012.workers.dev', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await res.json();
    console.log("管理端保存结果:", result);

    if (!result.success) {
      throw new Error(result.error || "保存到管理端失败");
    }

    // 2. 确定要从用户端删除的原始电话号码
    let originalPhoneNumber = null;
    
    // 查找与当前收据号对应的原始记录
    if (existingResult.success && existingResult.data) {
      // 如果收据号已存在，找到其原始电话号码
      originalPhoneNumber = findOriginalPhoneNumberByReceiptNumber(existingResult.data.receiptNumber);
    } else {
      // 如果是新记录，尝试从当前表格中找到最匹配的原始记录
      const tableRows = document.querySelectorAll("#entryTable tbody tr");
      for (let row of tableRows) {
        const cells = row.cells;
        const cellReceiptNumber = cells[2].textContent.trim(); // 假设收据号在第3列
        if (cellReceiptNumber === receiptNumber) {
          originalPhoneNumber = cells[0].textContent.trim(); // 假设电话号码在第1列
          break;
        }
      }
    }

    // 3. 如果找到了原始电话号码，则先查询用户端是否存在该记录
    if (originalPhoneNumber) {
      console.log("准备删除原始记录，电话号码:", originalPhoneNumber);
      
      // 先查询用户端是否存在该记录
      const queryBody = {
        method: "GET",
        phoneNumber: originalPhoneNumber
      };
      
      const queryRes = await fetch('https://userts.gealarm2012.workers.dev', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      });
      
      const queryResult = await queryRes.json();
      console.log("查询用户端原始记录结果:", queryResult);
      
      if (queryResult.success && queryResult.data) {
        // 记录存在，执行删除
        const deleteBody = {
          phoneNumber: originalPhoneNumber,
          method: "DELETE"
        };

        const deleteRes = await fetch('https://userts.gealarm2012.workers.dev', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deleteBody)
        });

        const deleteResult = await deleteRes.json();
        console.log("用户端删除结果:", deleteResult);
        
        if (deleteResult.success) {
          console.log(`成功从用户端删除原始记录: ${originalPhoneNumber}`);
        } else {
          console.warn(`删除用户端记录失败:`, deleteResult.error);
        }
      } else {
        console.warn(`用户端未找到原始记录: ${originalPhoneNumber}`, queryResult);
      }
    } else {
      console.warn("未能确定要删除的原始电话号码");
    }

    // 4. 更新本地UI显示
    refreshTable();
    
    // 清空表单
    document.getElementById("entryForm").reset();
    
    alert("条目已强制插入管理数据库！");
    
  } catch (error) {
    console.error("强制插入新条目时出错:", error);
    alert(`操作失败: ${error.message}`);
  }
}

// 辅助函数：根据收据号查找原始电话号码
function findOriginalPhoneNumberByReceiptNumber(receiptNumber) {
  // 遍历当前表格数据，查找具有相同收据号的记录
  const tableRows = document.querySelectorAll("#entryTable tbody tr");
  for (let row of tableRows) {
    const cells = row.cells;
    const cellReceiptNumber = cells[2].textContent.trim(); // 假设收据号在第3列
    if (cellReceiptNumber === receiptNumber) {
      return cells[0].textContent.trim(); // 返回电话号码（假设在第1列）
    }
  }
  return null;
}

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
  
  // --- 第一步：检查核心数据 (只检查名字) ---
  // 注意：这里我们不再检查 receiptInput.value，允许它是空的
  const currentData = getCurrentFormData();

  if (!currentData || !currentData.mainName) {
      alert("请先填写【主祈者姓名】，否则小票无法打印！");
      return; 
  }

  // --- 第二步：执行预览 ---
  // 这里不再强制生成号码！
  // 如果是空的，currentData.receiptNumber 就是 undefined，预览页会显示 "未生成"
  console.log("👀 正在打开预览窗口... (尚未生成正式单号)");
  
  const win = window.open("receipt-print.html", "_blank");
  
  if (!win) {
      alert("打印窗口被浏览器拦截，请允许弹窗！");
      return;
  }

  // 等待打印页面加载完成，然后发送数据
  const interval = setInterval(() => {
      if (win && win.document.readyState === "complete") {
          clearInterval(interval);
          // 发送数据给预览页
          win.postMessage(JSON.stringify(currentData), "*");
      }
  }, 100);
};

// 新增函数：供预览页调用，用于正式生成单号
window.finalizeReceiptNumber = function() {
    const receiptInput = document.getElementById("receiptNumber");
    
    // 如果输入框已经有值了（比如之前打印过），直接返回
    if (receiptInput.value && receiptInput.value !== "未生成") {
        return receiptInput.value;
    }

    // 否则，生成新号码
    const newNo = generateTempReceiptNumber(); // 或者你用的 generateReceiptNumber
    receiptInput.value = newNo;
    
    // 注意：这里不保存数据，只填号。保存动作留给预览页的 saveToCache 去做。
    return newNo;
};
