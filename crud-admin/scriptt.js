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


window.forceInsertNewEntry = async function () {
  // 修改这一行：使用正确的ID "phone" 而不是 "phoneNumber"
  const inputPhone = document.getElementById("phone").value.trim();
  
  if (!inputPhone) return alert("请填写电话号码！");

  // --- 查重与自动重命名逻辑 ---
  let finalPhone = inputPhone;
  let counter = 1;
  let needsRename = false;

  // 检查管理Worker中原始号码是否存在（不管是否是移动操作都需要查重）
  try {
    const checkRes = await fetch(`https://lucky-cloud-f9c3.gealarm2012.workers.dev?search=${encodeURIComponent(inputPhone)}`);
    const checkData = await checkRes.json();
    
    // 如果后端返回的是数组，且长度大于0，说明已存在
    if (Array.isArray(checkData) && checkData.length > 0) {
      needsRename = true;
    }
  } catch (e) {
    console.error("查询出错", e);
    alert("查询后端失败，请检查网络");
    return;
  }

  // 如果存在，开始循环尝试 +1, +2...
  if (needsRename) {
    while (needsRename) {
      const testPhone = `${inputPhone}+${counter}`;
      try {
        // 再次查询新号码
        const res = await fetch(`https://lucky-cloud-f9c3.gealarm2012.workers.dev?search=${encodeURIComponent(testPhone)}`);
        const json = await res.json();
        
        // 如果查到了数据（数组长度>0），说明这个新号码也被占用了
        if (Array.isArray(json) && json.length > 0) {
          counter++; // 继续加号
        } else {
          finalPhone = testPhone; // 找到了没被占用的号码
          needsRename = false;    // 退出循环
        }
      } catch (e) {
        alert("查重过程出错，请重试");
        return;
      }
    }
    
    // 提示用户号码被修改了
    alert(`⚠️ 检测到手机号 "${inputPhone}" 已存在！\n系统已自动为您修改为：\n\n【 ${finalPhone} 】\n\n请留意后续数据。`);
  }
  // --- 查重逻辑结束 ---

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

  const currentReceiptNumber = document.getElementById("receiptNumber").value.trim();
    
  const body = {
    phoneNumber: finalPhone, // 使用最终确定的号码
    mainName: document.getElementById("mainName").value.trim(),
    data: updatedData,
    receiptNumber: currentReceiptNumber,
    receiptDate: document.getElementById("receiptDate").value.trim(),
    wishReturn: document.querySelector('input[name="wishReturn"]:checked')?.value || "",
    offering: document.querySelector('input[name="offering"]:checked')?.value || "",
    wishPaper: document.getElementById("wishPaper").value.trim(),
    admin: localStorage.getItem("admin") || "未登录",
    method: "POST"
  };

  // 显示保存进度提示
  alert("🔄 正在提交数据到管理端...");

  try {
    // 1. 保存到管理Worker (https://lucky-cloud-f9c3.gealarm2012.workers.dev)
    const insertRes = await fetch("https://lucky-cloud-f9c3.gealarm2012.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const insertResult = await insertRes.json();
    if (!insertResult.success) {
      throw new Error(insertResult.message || "管理Worker保存失败");
    }

    alert("✅ 数据已成功保存到管理端！");

    // 2. 检查是否有selectedEntry（即是否是从用户端移动过来的数据）
    if (selectedEntry && selectedEntry.phoneNumber) {
      alert("🔄 正在从用户端删除原记录...");
      
      // 3. 删除用户Worker中的原记录 (YOUR_GAS_DEPLOYMENT_URL)
      const deleteBody = {
        phoneNumber: selectedEntry.phoneNumber, // 用户端使用phoneNumber字段删除
        method: "DELETE"
      };
      
      const deleteRes = await fetch('https://userts.gealarm2012.workers.dev', { // 这是用户端Worker
        method: 'POST', // GAS只接受POST请求
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deleteBody)
      });

      const deleteResult = await deleteRes.json();
      console.log("用户端删除响应内容:", deleteResult);
      
      if (!deleteResult.success) {
        console.error("用户端删除失败:", deleteResult.message);
        alert("⚠️ 数据已保存到管理端，但用户端删除失败：" + deleteResult.message);
      } else {
        alert("✅ 原记录已从用户端成功删除！");
      }
    } else {
      alert("✅ 数据已提交成功！");
    }
    
    // 清空表单并返回搜索页面
    if (typeof startNewEntry === 'function') {
      startNewEntry(); // 清空表单
    } else {
      // 如果没有startNewEntry函数，手动清空
      document.getElementById("entryForm").innerHTML = "";
    }
    
    // 返回搜索页面
    setTimeout(() => {
      window.location.hash = '#search';
      location.reload();
    }, 2000);

  } catch (error) {
    console.error("保存过程中出错:", error);
    alert("❌ 保存失败：" + error.message);
  }
};

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
