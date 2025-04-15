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
    div.className = "card";

    div.innerHTML = `
      <h6>第 ${i + 1} 位</h6>
      <div class="row">
        <div class="col-md-4"><label>姓名</label><input class="form-control pName" value="${item.name || ""}"/></div>
        <div class="col-md-4"><label>生肖</label><input class="form-control pZodiac" value="${item.zodiac || ""}"/></div>
        <div class="col-md-4"><label>太岁</label><input class="form-control pTaiSui" value="${item.taiSui || ""}"/></div>
      </div>
      <div class="row">
        <div class="col-md-4"><label>光明灯</label><input class="form-control pLight" value="${item.light || ""}"/></div>
        <div class="col-md-4"><label>长生禄位</label><input class="form-control pLongevity" value="${item.longevity || ""}"/></div>
        <div class="col-md-4"><label>文昌帝君</label><input class="form-control pWisdom" value="${item.wisdom || ""}"/></div>
      </div>
      <div class="row">
        <div class="col-md-4"><label>十六罗汉</label><input class="form-control pArhat" value="${item.arhat || ""}"/></div>
        <div class="col-md-4"><label>纸金1~5</label>
          <div class="d-flex gap-1">
            <input type="number" class="form-control pg1" value="${item.paperGold1 || 0}" />
            <input type="number" class="form-control pg2" value="${item.paperGold2 || 0}" />
            <input type="number" class="form-control pg3" value="${item.paperGold3 || 0}" />
            <input type="number" class="form-control pg4" value="${item.paperGold4 || 0}" />
            <input type="number" class="form-control pg5" value="${item.paperGold5 || 0}" />
          </div>
        </div>
        <div class="col-md-4"><label>功德金</label><input type="number" class="form-control donate" value="${item.donation || 0}"/></div>
      </div>
    `;
    container.appendChild(div);
  });
}
