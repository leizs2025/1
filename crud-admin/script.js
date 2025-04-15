let fullData = [];
let selectedEntry = null;

function searchPhone() {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return alert("请输入手机号关键字");

  fetch(`https://你的worker地址?search=${encodeURIComponent(keyword)}`)
    .then(res => res.json())
    .then(data => {
      const selector = document.getElementById("resultSelector");
      selector.innerHTML = "";
      fullData = data;

      if (!Array.isArray(data) || data.length === 0) {
        selector.textContent = "未找到资料";
        return;
      }

      const select = document.createElement("select");
      select.innerHTML = `<option disabled selected>请选择一笔资料</option>`;
      data.forEach((item, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = `${item.serial}｜${item.phoneNumber}`;
        select.appendChild(opt);
      });
      select.onchange = () => {
        selectedEntry = fullData[select.value];
        renderForm();
      };
      selector.appendChild(select);
    });
}

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
    div.innerHTML = `
      <strong>第${i + 1}位</strong><br>
      姓名: <input class="pName" value="${item.name || ''}" />
      生肖: <input class="pZodiac" value="${item.zodiac || ''}" />
      太岁: <input class="pTaiSui" value="${item.taiSui || ''}" />
      光明灯: <input class="pLight" value="${item.light || ''}" />
      长生禄位: <input class="pLongevity" value="${item.longevity || ''}" />
      文昌帝君: <input class="pWisdom" value="${item.wisdom || ''}" />
      十六罗汉: <input class="pArhat" value="${item.arhat || ''}" />
      纸金1~5: <input type="number" class="pg1" value="${item.paperGold1 || 0}" />
      <input type="number" class="pg2" value="${item.paperGold2 || 0}" />
      <input type="number" class="pg3" value="${item.paperGold3 || 0}" />
      <input type="number" class="pg4" value="${item.paperGold4 || 0}" />
      <input type="number" class="pg5" value="${item.paperGold5 || 0}" />
      功德金: <input type="number" class="donate" value="${item.donation || 0}" />
      <hr>
    `;
    container.appendChild(div);
  });
}

function saveChanges() {
  const data = [...document.getElementById("prayersContainer").children].map(div => ({
    name: div.querySelector(".pName").value,
    zodiac: div.querySelector(".pZodiac").value,
    taiSui: div.querySelector(".pTaiSui").value,
    light: div.querySelector(".pLight").value,
    longevity: div.querySelector(".pLongevity").value,
    wisdom: div.querySelector(".pWisdom").value,
    arhat: div.querySelector(".pArhat").value,
    paperGold1: +div.querySelector(".pg1").value,
    paperGold2: +div.querySelector(".pg2").value,
    paperGold3: +div.querySelector(".pg3").value,
    paperGold4: +div.querySelector(".pg4").value,
    paperGold5: +div.querySelector(".pg5").value,
    donation: +div.querySelector(".donate").value,
  }));

  const body = {
    phoneNumber: selectedEntry.phoneNumber,
    receiptNumber: document.getElementById("receiptNumber").value.trim(),
    receiptDate: document.getElementById("receiptDate").value.trim(),
    data
  };

  fetch("https://你的worker地址", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(res => alert(res.success ? "保存成功！" : "保存失败！"));
}

function deleteEntry() {
  if (!confirm("确认删除整组资料？")) return;
  fetch(`https://你的worker地址?delete=${selectedEntry.phoneNumber}`)
    .then(res => res.json())
    .then(res => {
      alert("删除成功");
      location.reload();
    });
}

function printEntry() {
  const win = window.open("form-print.html", "_blank");
  win.onload = () => {
    win.postMessage(JSON.stringify(selectedEntry), "*");
  };
}
