let fullData = [];
let selectedEntry = null;

function searchPhone() {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return alert("请输入手机号关键字！");

  fetch(`https://你的worker地址?search=${encodeURIComponent(keyword)}`)
    .then(res => res.json())
    .then(data => {
      const selector = document.getElementById("resultSelector");
      selector.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        selector.textContent = "未找到资料";
        return;
      }

      fullData = data;

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
        renderEntry();
      };

      selector.appendChild(select);
    })
    .catch(err => {
      console.error("查询失败", err);
      alert("查询失败！");
    });
}

function renderEntry() {
  const container = document.getElementById("resultDisplay");
  const entry = selectedEntry;
  container.innerHTML = `
    <h3>📌 精确资料</h3>
    <p>主祈者：${entry.mainName}</p>
    <p>电话：${entry.phoneNumber}</p>
    <p>收据号码：${entry.receiptNumber}</p>
    <p>收款日期：${entry.receiptDate}</p>
    <p>还愿：${entry.repayWish}</p>
    <p>纸金：${entry.repayAmount}</p>
    <p>安奉供养：${entry.worship}</p>
  `;
}
