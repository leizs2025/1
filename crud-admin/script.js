document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

function fetchData() {
  fetch("https://your-backend-endpoint.com")
    .then(response => response.json())
    .then(data => populateTable(data))
    .catch(err => console.error("数据加载失败：", err));
}

function populateTable(data) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.mainName}</td>
      <td>${item.phoneNumber}</td>
      <td>${item.receiptNumber || ""}</td>
      <td>${item.repayWish || ""}</td>
      <td>${item.repayAmount || ""}</td>
      <td>${item.worship || ""}</td>
      <td><button onclick="editEntry(${index})">编辑</button></td>
    `;

    tbody.appendChild(row);
  });
}

function editEntry(index) {
  // 实现编辑功能
}
