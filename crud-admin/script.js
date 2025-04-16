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
      console.error("⚠️ JSON 解析失败：", text);
      alert("查询失败：返回的不是有效 JSON");
      return;
    }

    if (!Array.isArray(data)) {
      console.warn("⚠️ 返回的不是数组：", data);
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
      select.onchange = () => {
        selectedEntry = data[select.selectedIndex];
        renderForm();
      };
      data.forEach(item => {
        const option = document.createElement("option");
        option.textContent = `${item.serial}｜${item.phoneNumber}`;
        select.appendChild(option);
      });
      selector.appendChild(select);
    }
  })
  .catch(err => {
    console.error(err);
    alert("查询失败：" + err.message);
  });

};

function renderForm() {
  document.getElementById("adminForm").classList.remove("hidden");

  document.getElementById("mainName").value = selectedEntry.mainName;
  document.getElementById("phoneNumber").value = selectedEntry.phoneNumber;
  document.getElementById("receiptNumber").value = selectedEntry.receiptNumber || "";
  document.getElementById("receiptDate").value = selectedEntry.receiptDate || "";

  const container = document.getElementById("prayersContainer");
  container.innerHTML = "";

  selectedEntry.data.forEach((item, i) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.margin = "5px";
    div.style.padding = "5px";

    div.innerHTML = `
      <strong>第 ${i + 1} 位</strong><br/>
      姓名: <input value="${item.name || ""}" class="pName"/>
      生肖: <input value="${item.zodiac || ""}" class="pZodiac"/>
      太岁: <input value="${item.taiSui || ""}" class="pTaiSui"/>
      光明灯: <input value="${item.light || ""}" class="pLight"/>
      长生禄位: <input value="${item.longevity || ""}" class="pLongevity"/>
      文昌帝君: <input value="${item.wisdom || ""}" class="pWisdom"/>
      十六罗汉: <input value="${item.arhat || ""}" class="pArhat"/>
      纸金1: <input type="number" value="${item.paperGold1 || 0}" class="pg1"/>
      纸金2: <input type="number" value="${item.paperGold2 || 0}" class="pg2"/>
      纸金3: <input type="number" value="${item.paperGold3 || 0}" class="pg3"/>
      纸金4: <input type="number" value="${item.paperGold4 || 0}" class="pg4"/>
      纸金5: <input type="number" value="${item.paperGold5 || 0}" class="pg5"/>
      安奉功德金: <input type="number" value="${item.donation || 0}" class="donate"/>
    `;
    container.appendChild(div);
  });
}

window.saveChanges = function () {
  if (!selectedEntry) return alert("请先查询一笔资料");

  const updatedData = [];
  const blocks = document.getElementById("prayersContainer").children;

  for (let div of blocks) {
    updatedData.push({
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
      donation: +div.querySelector(".donate").value || 0,
    });
  }

  const body = {
    phoneNumber: selectedEntry.phoneNumber,
    data: updatedData,
    receiptNumber: document.getElementById("receiptNumber").value.trim(),
    receiptDate: document.getElementById("receiptDate").value.trim()
  };

fetch("https://lucky-cloud-f9c3.gealarm2012.workers.dev", {
  method: "POST", // Use POST instead of PUT
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "PUT", // Custom field to indicate a PUT operation
    phoneNumber: selectedEntry.phoneNumber,
    data: updatedData,
    receiptNumber: document.getElementById("receiptNumber").value.trim(),
    receiptDate: document.getElementById("receiptDate").value.trim()
  })
})
  .then(res => res.json())
  .then(result => {
    if (result.success) alert("保存成功！");
    else alert("保存失败：" + result.message);
  });

};

window.printEntry = function () {
  if (!selectedEntry) return alert("请先查出一笔资料");
  const win = window.open("form-print.html", "_blank");
  win.onload = () => {
    win.postMessage(JSON.stringify(selectedEntry), "*");
  };
};
