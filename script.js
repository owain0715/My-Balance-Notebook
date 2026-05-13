"use strict";

//idがあると個体を識別できるため、必ず入れる
let expensesCategories = [
  { id: 1, name: "食費", isDefault: true, isFixed: false, isRecurring: false },
  {
    id: 2,
    name: "水道光熱費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  {
    id: 3,
    name: "交通費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  {
    id: 4,
    name: "交際費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  { id: 5, name: "住居費", isDefault: true, isFixed: true, isRecurring: false },
  {
    id: 6,
    name: "サブスク",
    isDefault: true,
    isFixed: true,
    isRecurring: false,
  },
  { id: 7, name: "保険料", isDefault: true, isFixed: true, isRecurring: false },
  {
    id: 8,
    name: "通信費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  {
    id: 9,
    name: "日用品費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  {
    id: 10,
    name: "美容費",
    isDefault: true,
    isFixed: false,
    isRecurring: false,
  },
  { id: 11, name: "趣味", isDefault: true, isFixed: false, isRecurring: false },
];

let incomesCategories = [
  { id: 1, name: "給与", isDefault: true },
  { id: 2, name: "臨時収入", isDefault: true },
];

//localStorageに保存しているデータを読み込む（ページ読み込み時のみ）
const saved = localStorage.getItem("categories");

if (saved) {
  expensesCategories = JSON.parse(saved);
}

//給与もlocalStorageに保存
const savedIncomeCategories = localStorage.getItem("incomesCategories");

if (savedIncomeCategories) {
  incomesCategories = JSON.parse(savedIncomeCategories);
}

//初期カテゴリは食費に
const defaultExpenseCategory = expensesCategories.find(
  (c) => c.name === "食費",
);
let selectedExpenseCategoryId = defaultExpenseCategory?.id ?? null;

//グローバルに置いておく
let limits = [];
let expenses = [];

let incomes = [];
let editingIncomeId = null;

const defaultIncomeCategory = incomesCategories.find((C) => C.name === "給与");
let selectedIncomeCategoryId = defaultIncomeCategory?.id ?? null;

//保存用のキーは必ず統一"expenses"の部分
const savedExpenses = localStorage.getItem("expenses");

if (savedExpenses) {
  expenses = JSON.parse(savedExpenses);
}

//limit保存
const savedLimits = localStorage.getItem("limits");

if (savedLimits) {
  limits = JSON.parse(savedLimits);
}

//income保存
const savedIncomes = localStorage.getItem("incomesData");

if (savedIncomes) {
  incomes = JSON.parse(savedIncomes);
}

let chart;

//取得ゾーン
const input = document.getElementById("expense-category-input");
const addBtn = document.getElementById("addBtn");
const categoryListUl = document.getElementById("category-list");
const form = document.getElementById("expense-form");

const amountInput = document.getElementById("amount-input");
const amountBtn = document.getElementById("amountBtn");
const amountHeader = document.getElementById("amount-header");
const amountList = document.getElementById("amount-list");

const expensesSumEl = document.getElementById("expense-sum");
const limitInput = document.getElementById("expense-limit-input");
const limitBtn = document.getElementById("limitBtn");
const limitUl = document.getElementById("limit-ul");
const progressEl = document.getElementById("progress");
const alertEl = document.getElementById("alert");
const dayProgress = document.getElementById("day-progress");
const memoInput = document.getElementById("memo-input");
const monthlyReport = document.getElementById("monthly-report");
const editAmountInput = document.getElementById("edit-amount");
const editMemoInput = document.getElementById("edit-memo");
const saveBtn = document.getElementById("save-btn");
const editModal = document.getElementById("edit-modal");
const cancelBtn = document.getElementById("cancel-btn");
const limitArea = document.getElementById("expense-limit-area");
const progressArea = document.getElementById("progress-area");
const fixedMessage = document.getElementById("fixed-message");
const prevMonthBtn = document.getElementById("prev-month");
const currentMonthEl = document.getElementById("current-month");
const nextMonthBtn = document.getElementById("next-month");
const dateInput = document.getElementById("date-input");
const expenseListToggleBtn = document.getElementById("list-toggle-btn");
const typeSelect = document.getElementById("type-select");
const buttons = document.querySelectorAll("#menu-buttons button");
const pages = document.querySelectorAll(".page");

//incomeページの取得ゾーン
const incomeInput = document.getElementById("income-input");
const incomeAddBtn = document.getElementById("income-add-btn");
const incomeCategoryListEl = document.getElementById("income-category-list");
const incomeAmountInput = document.getElementById("income-amount-input");
const incomeDateInput = document.getElementById("income-date-input");
const incomeAmountBtn = document.getElementById("income-amount-btn");
const incomeAmountList = document.getElementById("income-amount-list");
const incomeMemoInput = document.getElementById("income-memo-input");
const incomeSaveBtn = document.getElementById("income-save-btn");
const incomeCancelBtn = document.getElementById("income-cancel-btn");
const incomeEditMemo = document.getElementById("income-edit-memo");
const incomeEditAmount = document.getElementById("income-edit-amount");
const incomeEditModal = document.getElementById("income-edit-modal");
const incomeListToggleBtn = document.getElementById("income-list-toggle-btn");

let editingExpenseId = null;

//日付管理
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

//日付の初期設定は今日にしておく
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");

dateInput.value = `${yyyy}-${mm}-${dd}`;
incomeDateInput.value = `${yyyy}-${mm}-${dd}`;

//支出/収入リストの表示状態
let isExpenseOpen = true;
let isIncomeOpen = true;

//ページの初期状態
showPage("expenses");
buttons[0].classList.add("active");

//描画render
function render() {
  const state = createViewState();
  const meta = createMeta();

  //今月表示
  currentMonthEl.textContent = `${currentYear}/${currentMonth}`;

  renderAll(state, meta);
}

//renderの全体まとめ
function renderAll(state, meta) {
  renderCategoryList(state);
  renderExpenseSection(state, meta);
  renderIncomeSection();
  renderAnalytics(meta);
  renderCalendar();
}

//支出描画関数まとめ
function renderExpenseSection(state, meta) {
  renderExpenseList(state);
  renderLimitInfo(state);

  renderProgress(state, meta);
  renderMonthlyReport(meta);
}

//収入描画関数まとめ
function renderIncomeSection() {
  renderIncomeList();
  renderIncomeData();
}

//アナリティクス欄描画関数
function renderAnalytics(meta) {
  renderPieChart();
  renderLineChart();
  renderRanking();
}

//支出カテゴリー追加イベント
addBtn.addEventListener("click", () => {
  const text = input.value.trim();
  const isFixed = typeSelect.value === "fixed";

  const isRecurring = isFixed ? confirm("この固定費は毎月同額ですか？") : false;

  //空白・同じ名前ならreturn
  if (text === "") return;
  if (expensesCategories.some((c) => c.name === text)) return;

  expensesCategories.push({
    id: Date.now(),
    name: text,
    isDefault: false,
    isFixed: isFixed,
    isRecurring: isFixed ? isRecurring : false,
  });

  //追加したときに保存
  localStorage.setItem("categories", JSON.stringify(expensesCategories));

  render();

  input.value = ""; //入力欄を空にして綺麗に
});

//支出追加ボタンイベント
amountBtn.addEventListener("click", () => {
  const amount = Number(amountInput.value);

  if (!selectedExpenseCategoryId) {
    alert("カテゴリを選択してください");
    return;
  }

  if (!amount || amount <= 0) return;

  expenses.push({
    id: Date.now(),
    categoryId: selectedExpenseCategoryId,
    amount: amount,
    memo: memoInput.value.trim() || "(未入力)",
    date: dateInput.value || new Date().toISOString().slice(0, 10),
  });

  //保存用のキーは必ず統一"expenses"の部分
  localStorage.setItem("expenses", JSON.stringify(expenses));

  render();

  memoInput.value = "";
  amountInput.value = "";

  //入力後はメモ欄にフォーカス、日付も今日に戻す（ユーザー体験の向上）
  //結局消した（スマホ使用想定で、memoInputにフォーカスされてしまうと入力欄が邪魔をして、新規追加された支出が見えにくくなるため）
  // memoInput.focus();
  dateInput.value = new Date().toISOString().slice(0, 10);
});

//先月に戻るボタン
prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth === 0) {
    currentMonth = 12;
    currentYear--;
  }
  autoAddRecurringExpenses();
  render();
});

//来月に進むボタン
nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth === 13) {
    currentMonth = 1;
    currentYear++;
  }

  autoAddRecurringExpenses();
  render();
});

//支出モーダルに編集値を入れる関数
function openExpenseEditModal(expense) {
  editAmountInput.value = expense.amount;
  editMemoInput.value = expense.memo;
  editingExpenseId = expense.id;

  editModal.classList.remove("hidden");
  //開いた瞬間にamount部分がセレクトされるのでユーザーが迷わない仕様に
  editAmountInput.focus();
}

//支出モーダル編集後保存処理
saveBtn.addEventListener("click", () => {
  //収入編集
  if (editingIncomeId !== null) {
    if (editMemoInput.value.trim() === "") return;

    const target = incomes.find((i) => i.id === editingIncomeId);
    if (!target) return;

    target.memo = editMemoInput.value;
    target.amount = Number(editAmountInput.value);

    localStorage.setItem("incomesData", JSON.stringify(incomes));

    editingIncomeId = null;
    closeEditModal();
    renderIncomeData();
    return;
  }
  //支出編集
  const target = expenses.find((e) => e.id === editingExpenseId);

  if (!target) return;

  target.amount = Number(editAmountInput.value);
  target.memo = editMemoInput.value;

  localStorage.setItem("expenses", JSON.stringify(expenses));

  closeEditModal();
  render();
});

function handleIncomeSave() {
  //収入モーダル編集後保存処理
  if (editingIncomeId === null) return;

  const target = incomes.find((i) => i.id === editingIncomeId);
  if (!target) return;

  target.memo = incomeEditMemo.value;
  target.amount = Number(incomeEditAmount.value);

  localStorage.setItem("incomesData", JSON.stringify(incomes));

  editingIncomeId = null;
  incomeEditModal.classList.add("hidden");

  renderIncomeData();
}

//収入モーダル保存
incomeSaveBtn.addEventListener("click", handleIncomeSave);

//モーダルを閉じる関数
function closeEditModal() {
  editModal.classList.add("hidden");
  editingExpenseId = null;
}

function closeIncomeEditModal() {
  incomeEditModal.classList.add("hidden");
  editingIncomeId = null;
}

//キャンセルボタンでモーダルを閉じる
cancelBtn.addEventListener("click", () => {
  closeEditModal();
});

//収入モーダルキャンセル
incomeCancelBtn.addEventListener("click", () => {
  closeIncomeEditModal();
});

//収入モーダル開く
function openIncomeEditModal(income) {
  incomeEditAmount.value = income.amount;
  incomeEditMemo.value = income.memo;
  editingIncomeId = income.id;

  incomeEditModal.classList.remove("hidden");
  incomeEditAmount.focus();
}

//限度額設定
limitBtn.addEventListener("click", () => {
  const limitEl = Number(limitInput.value);

  if (limitInput.value === "") return;
  if (isNaN(limitEl)) return;
  if (!selectedExpenseCategoryId) return;

  const existing = limits.find(
    (l) =>
      l.categoryId === selectedExpenseCategoryId &&
      l.year === currentYear &&
      l.month === currentMonth,
  );

  if (existing) {
    existing.amount = limitEl;
  } else {
    //なかったらpush!
    limits.push({
      categoryId: selectedExpenseCategoryId,
      amount: limitEl,
      year: currentYear,
      month: currentMonth,
    });
  }

  localStorage.setItem("limits", JSON.stringify(limits));

  render();

  limitInput.value = "";
});

//支出グルーピング関数
function groupByDate(expenses) {
  const grouped = {};

  expenses.forEach((expense) => {
    const date = expense.date;

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(expense);
  });

  return grouped;
}

//月次関数
function filterByMonth(expenses, year, month) {
  return expenses.filter((expense) => {
    const d = new Date(expense.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

//月次支出データ取得
function getMonthlyData(expenses, year, month) {
  let lastYear = year;
  let lastMonth = month - 1;

  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear--;
  }

  //filterByMonthをここで呼び出し
  const thisMonthF = filterByMonth(expenses, year, month);
  const lastMonthF = filterByMonth(expenses, lastYear, lastMonth);

  //calcTotalを呼び出し
  return {
    thisMonthTotal: calcTotal(thisMonthF),
    lastMonthTotal: calcTotal(lastMonthF),
  };
}

//合計関数
function calcTotal(expenses) {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

//isFixed: true時のリセット関数
function resetProgressUI() {
  alertEl.textContent = "";
  alertEl.classList.remove("danger", "warning", "good", "normal");
  dayProgress.textContent = "";
  progressEl.style.width = "0%";
  progressEl.style.background = "transparent";
}

//ステータスまとめ関数
function createViewState() {
  const selectedCategory = expensesCategories.find(
    (c) => c.id === selectedExpenseCategoryId,
  );

  const monthly = filterByMonth(expenses, currentYear, currentMonth);

  const filtered = selectedExpenseCategoryId
    ? monthly.filter((e) => e.categoryId === selectedExpenseCategoryId)
    : [];

  const sum = calcTotal(filtered);

  const existing = limits.find(
    (l) =>
      l.categoryId === selectedExpenseCategoryId &&
      l.year === currentYear &&
      l.month === currentMonth,
  );

  return {
    selectedCategory,
    filtered,
    sum,
    existing,
  };
}

//カテゴリー描画
function renderCategoryList(state) {
  //一旦空にする
  categoryListUl.innerHTML = "";

  //選択したidがnullじゃなかったらhiddenを解く→表示
  if (state.selectedCategory) {
    form.classList.remove("hidden");
  } else {
    form.classList.add("hidden");
  }

  //カテゴリーの中身を1つずつチェック
  expensesCategories.forEach((category) => {
    const li = document.createElement("li");
    li.textContent = category.name;

    //カテゴリ選択状態・クリックしたら選択中にする
    li.addEventListener("click", () => {
      selectedExpenseCategoryId = category.id;
      render();
    });

    if (category.id === selectedExpenseCategoryId) {
      li.classList.add("selected");
    }

    //削除ボタン・デフォルトで設定しているものには適用しない
    if (!category.isDefault) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.classList.add("delete-btn");

      deleteBtn.addEventListener("click", (e) => {
        //親のイベントの伝播を止める
        e.stopPropagation();

        if (
          !confirm(
            "このカテゴリを本当に削除しますか？一度削除すると復元できません。",
          )
        ) {
          return;
        }

        expensesCategories = expensesCategories.filter(
          (c) => c.id !== category.id,
        );

        //選択中のカテゴリを削除した場合は、表示を食費に戻す
        if (selectedExpenseCategoryId === category.id) {
          const defaultExpenseCategory = expensesCategories.find(
            (c) => c.name === "食費",
          );
          selectedExpenseCategoryId = defaultExpenseCategory?.id ?? null;
        }

        localStorage.setItem("categories", JSON.stringify(expensesCategories));

        //配列を更新したので再度描画する必要がある
        render();
      });
      li.append(deleteBtn);
    }

    categoryListUl.append(li);
  });
}

//収入カテゴリ描画関数
function renderIncomeList() {
  incomeCategoryListEl.innerHTML = "";

  incomesCategories.forEach((category) => {
    const li = document.createElement("li");
    li.textContent = category.name;

    li.addEventListener("click", () => {
      selectedIncomeCategoryId = category.id;
      renderIncomeList();
      toggleIncomeForm();
      renderIncomeData();
    });

    if (category.id === selectedIncomeCategoryId) {
      li.classList.add("selected");
    }

    if (!category.isDefault) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.classList.add("delete-btn");

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        if (
          !confirm(
            "このカテゴリを本当に削除しますか？一度削除すると復元できません。",
          )
        ) {
          return;
        }
        incomesCategories = incomesCategories.filter(
          (c) => c.id !== category.id,
        );

        if (selectedIncomeCategoryId === category.id) {
          const defaultIncomeCategory = incomesCategories.find(
            (c) => c.name === "給与",
          );
          selectedIncomeCategoryId = defaultIncomeCategory?.id ?? null;
        }

        localStorage.setItem(
          "incomesCategories",
          JSON.stringify(incomesCategories),
        );
        render();
      });

      li.append(deleteBtn);
    }

    incomeCategoryListEl.append(li);
  });
}

//収入カテゴリ追加イベント
incomeAddBtn.addEventListener("click", () => {
  const text = incomeInput.value.trim();

  if (text === "") return;
  if (incomesCategories.some((i) => i.name === text)) return;

  incomesCategories.push({
    id: Date.now(),
    name: text,
    isDefault: false,
  });

  localStorage.setItem("incomesCategories", JSON.stringify(incomesCategories));

  renderIncomeList();

  incomeInput.value = "";
});

//収入追加ボタンイベント
incomeAmountBtn.addEventListener("click", () => {
  const memo = incomeMemoInput.value;
  const amount = Number(incomeAmountInput.value);

  if (!selectedIncomeCategoryId) return;
  if (incomeMemoInput.value === "") return;
  if (!amount || amount <= 0) return;

  incomes.push({
    id: Date.now(),
    categoryId: selectedIncomeCategoryId,
    memo: memo,
    amount: amount,
    date: incomeDateInput.value || new Date().toISOString().slice(0, 10),
  });

  localStorage.setItem("incomesData", JSON.stringify(incomes));

  renderIncomeData();

  incomeMemoInput.value = "";
  incomeAmountInput.value = "";
  incomeDateInput.value = "";
});

//incomeフォームの表示/非表示トグル(初期状態は支出にするため)
function toggleIncomeForm() {
  if (selectedIncomeCategoryId) {
    document.getElementById("income-form").classList.remove("hidden");
  } else {
    document.getElementById("income-form").classList.add("hidden");
  }
}

//収入描画
function renderIncomeData() {
  incomeAmountList.innerHTML = "";

  //selectedIncomeCategoryIdが存在するならそのカテゴリIDだけfilter⏩カテゴリ未選択状態ではデータを出さない安全設計

  const monthly = filterByMonth(incomes, currentYear, currentMonth);

  const filtered = selectedIncomeCategoryId
    ? monthly.filter((i) => i.categoryId === selectedIncomeCategoryId)
    : [];

  //カテゴリが選択されていたら表示
  if (selectedIncomeCategoryId) {
    incomeAmountList.classList.remove("hidden");
  } else {
    incomeAmountList.classList.add("hidden");
    return;
  }

  //データ0件ならメッセージ表示
  if (filtered.length === 0) {
    incomeAmountList.innerHTML = "<p>まだ収入データがありません</p>";
    return;
  }

  const grouped = groupByDate(filtered);

  Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach((date) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const d = new Date(date);
      const dateEl = document.createElement("p");
      dateEl.classList.add("card-date");
      dateEl.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;

      const innerUl = document.createElement("ul");

      grouped[date].forEach((income) => {
        const li = document.createElement("li");

        const nameEl = document.createElement("span");
        nameEl.textContent = income.memo;

        const amountEl = document.createElement("span");
        amountEl.textContent = `¥${income.amount}`;
        amountEl.classList.add("amount");

        li.append(nameEl);
        li.append(amountEl);

        //収入編集ボタン
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.classList.add("icon-btn");

        editBtn.addEventListener("click", () => {
          console.log("編集クリック", income);
          openIncomeEditModal(income);
        });

        //収入削除ボタン
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.classList.add("icon-btn");

        deleteBtn.addEventListener("click", () => {
          if (
            !confirm("この収入を削除しますか？一度削除すると復元できません。")
          ) {
            return;
          }

          incomes = incomes.filter((i) => i.id !== income.id);
          localStorage.setItem("incomesData", JSON.stringify(incomes));
          renderIncomeData();
        });
        li.append(editBtn);
        li.append(deleteBtn);
        innerUl.append(li);
      });

      card.append(dateEl);
      card.append(innerUl);

      incomeAmountList.append(card);
    });
}

//メタ定義/今の画面に必要な状況データまとめ
function createMeta() {
  const now = new Date();

  const isCurrentMonth =
    now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth;

  const dayInMonth = new Date(currentYear, currentMonth, 0).getDate();

  //今月であるかどうかの条件分岐
  const today = isCurrentMonth ? now.getDate() : dayInMonth;

  const { thisMonthTotal, lastMonthTotal } = getMonthlyData(
    expenses,
    currentYear,
    currentMonth,
  );
  const expenseDiff = thisMonthTotal - lastMonthTotal;

  return {
    today,
    dayInMonth,
    thisMonthTotal,
    lastMonthTotal,
    expenseDiff,
  };
}

//支出リスト描画
function renderExpenseList(state) {
  //支出追加ボタン・categories.forEachの外に出す
  amountList.innerHTML = "";

  const hasData = state.filtered.length > 0;

  if (!hasData) {
    amountHeader.classList.add("hidden");
    amountList.classList.add("hidden");
    expensesSumEl.classList.add("hidden");
    return;
  } else {
    amountHeader.classList.remove("hidden");
    amountList.classList.remove("hidden");
    expensesSumEl.classList.remove("hidden");
  }

  //関数呼び出し
  const grouped = groupByDate(state.filtered);

  //オブジェクトのキー一覧を配列で取る
  Object.keys(grouped)
    //   最新の日付が下に来る
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach((date) => {
      // const dateLi = document.createElement("li");

      const card = document.createElement("div");
      card.classList.add("card");

      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();

      const dateEl = document.createElement("p");
      dateEl.textContent = `${month}月${day}日`;
      dateEl.classList.add("card-date");

      const innerUl = document.createElement("ul");

      grouped[date].forEach((expense) => {
        const itemLi = document.createElement("li");

        if (expense.id === editingExpenseId) {
          itemLi.classList.add("editing");
        }

        const amountEl = document.createElement("span");
        amountEl.textContent = `¥${expense.amount.toLocaleString()}`;
        amountEl.classList.add("amount");

        const memoEl = document.createElement("span");
        memoEl.textContent = expense.memo;

        itemLi.append(memoEl);
        itemLi.append(amountEl);

        //支出編集ボタン
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        // editBtn.classList.add("edit-btn");
        editBtn.classList.add("icon-btn");

        editBtn.addEventListener("click", () => {
          openExpenseEditModal(expense);
        });

        itemLi.append(editBtn);

        //削除ボタン
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.classList.add("icon-btn");

        deleteBtn.addEventListener("click", () => {
          if (
            !confirm("この支出を削除しますか？一度削除すると復元できません。")
          ) {
            return;
          }

          //今見てる1つのexpenseのidと違うものだけを残すってこと！filterは消すというよりも残すものを選ぶに近い
          expenses = expenses.filter((e) => e.id !== expense.id);
          localStorage.setItem("expenses", JSON.stringify(expenses));
          render();
        });

        itemLi.append(deleteBtn);
        innerUl.append(itemLi);
      });

      card.append(dateEl);
      card.append(innerUl);
      amountList.append(card);
    });

  expensesSumEl.innerHTML = `
<div>
  <span class="marker">
    今月の${state.selectedCategory?.name}合計
  </span>
  <br>

  <span class="sum-amount marker">
    ¥${state.sum.toLocaleString()}
  </span>
</div>`;

  //前月比データ取得
  if (state.selectedCategory) {
    const { thisMonthTotal, lastMonthTotal } = getCategoryMonthlyData(
      expenses,
      state.selectedCategory.id,
      currentYear,
      currentMonth,
    );

    const diff = thisMonthTotal - lastMonthTotal;

    const diffEl = document.createElement("p");

    if (lastMonthTotal === 0) {
      diffEl.textContent = "先月のデータはありません";
      //変動費のみ以下表示
    } else if (!state.selectedCategory.isFixed) {
      if (diff > 0) {
        diffEl.textContent = `先月より ¥${Math.abs(diff).toLocaleString()}使い過ぎています😖`;
        diffEl.classList.add("monthly-diff-plus");
      } else if (diff < 0) {
        diffEl.textContent = `先月より ¥${Math.abs(diff).toLocaleString()}節約できています✨`;
        diffEl.classList.add("monthly-diff-minus");
      } else {
        diffEl.textContent = `先月と同じペースです`;
      }
    }

    diffEl.classList.add("monthly-diff");
    amountList.append(diffEl);
  }
}

//限度額表示
function renderLimitInfo(state) {
  limitUl.innerHTML = "";

  //既にあるかどうか
  const li = document.createElement("li");

  if (state.existing) {
    li.innerHTML = `
  <span class="limit-label">今月の上限</span>

  <span class="limit-value">
    ¥${state.existing.amount.toLocaleString()}
  </span>
`;
    limitBtn.textContent = "上限を変更";
  } else {
    li.textContent = "上限未設定";
    limitBtn.textContent = "上限を設定";
  }

  limitUl.append(li);
}

//日数進捗部分の描画
function renderProgress(state, meta) {
  const { today, dayInMonth } = meta;

  let percent = 0;

  //未選択の状態
  if (!state.selectedCategory) {
    progressArea.classList.add("hidden");
    limitArea.classList.add("hidden");
    fixedMessage.textContent = "";
    return;
  }

  //isFixedならhiddenにする・固定費にprogress/limitは不要だから
  if (state.selectedCategory?.isFixed) {
    progressArea.classList.add("hidden");
    limitArea.classList.add("hidden");

    fixedMessage.textContent = "固定費のため上限管理はありません";

    return;
  }

  progressArea.classList.remove("hidden");
  limitArea.classList.remove("hidden");
  fixedMessage.textContent = "";

  if (state.existing && state.existing.amount > 0) {
    percent = Math.floor((state.sum / state.existing.amount) * 100);
    progressEl.style.width = Math.min(percent, 100) + "%"; //はみ出し防止/バーは100%で固定
  } else {
    progressEl.style.width = "0%";
  }

  //使用率
  const usagePercent = document.getElementById("usage-percent");
  usagePercent.textContent = `現在の使用率：${percent}%`;

  const expectedPercent = (today / dayInMonth) * 100;
  const dayPercent = Math.floor((today / dayInMonth) * 100);
  const percentDiff = percent - dayPercent;

  //使用ペースアラート部分
  if (today > 0) {
    const forecast = Math.floor((state.sum / today) * dayInMonth);

    const forecastEl = document.createElement("li");

    forecastEl.innerHTML = `
  <p class="forecast-label">このペースだと…</p>
  <p class="forecast-amount">
    月末見込： ¥${forecast.toLocaleString()}
  </p>
`;
    forecastEl.classList.add("forecast-card");
    limitUl.append(forecastEl);
  }

  if (state.selectedCategory?.isFixed) {
    resetProgressUI();
    return;
  }

  alertEl.classList.remove("danger", "warning", "good", "normal");

  if (!state.existing || state.existing.amount <= 0) {
    alertEl.textContent = "";
    alertEl.classList.add("hidden");
    dayProgress.textContent = "";
    progressEl.style.width = "0%";
  } else {
    alertEl.classList.remove("hidden");
    if (percent > 120) {
      const over = percent - 100;
      alertEl.textContent = `🚨かなり使い過ぎています！（+${over}%）`;
      alertEl.classList.add("danger");
    } else if (percent > 100) {
      const over = percent - 100;
      alertEl.textContent = `⚠️上限を超過しています（+${over}%）`;
      alertEl.classList.add("danger");
    } else if (percent > expectedPercent + 15) {
      alertEl.textContent = "⚠️使いすぎています";
      alertEl.classList.add("warning");
    } else if (percentDiff < -10) {
      alertEl.textContent = "🌱節約できています✨";
      alertEl.classList.add("good");
    } else {
      alertEl.textContent = "👍🏻順調です";
      alertEl.classList.add("normal");
    }
  }
  progressEl.style.background = getProgressColor(percent);
  dayProgress.textContent = `日数進捗：${dayPercent}% (${today}/${dayInMonth}日)`;

  // limitUl.append(usageLi);
}

//プログレスバーの色定義
function getProgressColor(percent) {
  if (percent < 50) {
    return "rgba(100, 205, 100, 1)";
  } else if (percent < 75) {
    return "rgba(255, 243, 107, 1)";
  } else if (percent < 100) {
    return "rgba(255, 147, 75, 1)";
  } else {
    return "rgba(222, 42, 42, 1)";
  }
}

//月次レポート描画
function renderMonthlyReport(meta) {
  const { thisMonthTotal, lastMonthTotal, expenseDiff } = meta;

  let message = "";

  if (expenseDiff > 0) {
    message = "先月より支出が増えています…！";
  } else if (expenseDiff < 0) {
    message = "先月よりも節約できています！";
  } else {
    message = "先月と同じペースです";
  }

  const diffClass = expenseDiff < 0 ? "good" : expenseDiff > 0 ? "bad" : "";

  monthlyReport.innerHTML = `
今月：¥${thisMonthTotal.toLocaleString()}<br>
先月：¥${lastMonthTotal.toLocaleString()}<br>
差分：<span class="${diffClass}">¥${formatDiff(expenseDiff)}
</span> (${message})
`;
}

//差分フォーマット
function formatDiff(diff) {
  return diff < 0
    ? `-${Math.abs(diff).toLocaleString()}`
    : `${diff.toLocaleString()}`;
}

//カテゴリ別先月比較
function getCategoryMonthlyData(expense, categoryId, year, month) {
  let lastYear = year;
  let lastMonth = month - 1;

  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear--; //1減らす
  }
  const filtered = expense.filter((e) => e.categoryId === categoryId);

  const thisMonthData = filterByMonth(filtered, year, month);
  const lastMonthData = filterByMonth(filtered, lastYear, lastMonth);

  return {
    thisMonthTotal: calcTotal(thisMonthData),
    lastMonthTotal: calcTotal(lastMonthData),
  };
}

//支出リストの表示状態管理
expenseListToggleBtn.addEventListener("click", () => {
  isExpenseOpen = !isExpenseOpen;

  amountList.classList.toggle("closed");

  expenseListToggleBtn.textContent = isExpenseOpen
    ? "▼ 支出を隠す"
    : "▶ 支出を表示";
});

//収入リストの表示状態管理
incomeListToggleBtn.addEventListener("click", () => {
  isIncomeOpen = !isIncomeOpen;

  incomeAmountList.classList.toggle("closed");

  incomeListToggleBtn.textContent = isIncomeOpen
    ? "▼ 収入を隠す"
    : "▶ 収入を表示";
});

//固定費コピー関数
function autoAddRecurringExpenses() {
  const thisMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  expensesCategories
    .filter((c) => c.isFixed && c.isRecurring)
    .forEach((category) => {
      //今月データチェック
      const exists = expenses.some(
        (e) => e.categoryId === category.id && e.date.startsWith(thisMonthStr),
      );

      if (exists) return;

      //前月データチェック
      const lastMonthData = expenses
        .filter((e) => e.categoryId === category.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (!lastMonthData) return;

      //コピー
      expenses.push({
        id: Date.now(),
        categoryId: category.id,
        amount: lastMonthData.amount,
        memo: `${lastMonthData.memo.replace(/（毎月固定）/g, "")}（毎月固定）`,
        date: `${thisMonthStr}-01`,
      });
    });
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

//サマリー計算
function getExpenseCategorySummary() {
  const monthly = filterByMonth(expenses, currentYear, currentMonth);

  const summary = {};

  monthly.forEach((e) => {
    if (!summary[e.categoryId]) {
      summary[e.categoryId] = 0;
    }
    summary[e.categoryId] += e.amount;
  });

  return summary;
}

//円グラフ生成用データ
function createChartData(expenses) {
  const summary = {};

  expenses.forEach((e) => {
    if (!summary[e.categoryId]) {
      summary[e.categoryId] = 0;
    }
    summary[e.categoryId] += e.amount;
  });

  const labels = [];
  const data = [];

  Object.keys(summary).forEach((categoryId) => {
    const category = expensesCategories.find(
      (c) => c.id === Number(categoryId),
    );
    if (!category) return;

    labels.push(category.name);
    data.push(summary[categoryId]);
  });

  return { labels, data };
}

//円グラフ描画
function renderPieChart() {
  const ctx = document.getElementById("pie-chart");

  const monthly = filterByMonth(expenses, currentYear, currentMonth);

  const { labels, data } = createChartData(monthly);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,

      datasets: [
        {
          data: data,
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
          backgroundColor: [
            "#ffb3ba", // パステルレッド
            "#ffdfba", // パステルオレンジ
            "#ffffba", // パステルイエロー
            "#baffc9", // パステルグリーン
            "#bae1ff", // パステルブルー
            "#b3cde0", // ソフトブルー
            "#ccebc5", // ミント
            "#ffc8dd", // ベビーピンク
            "#dec0f1", // ラベンダー
            "#cdb4db", // ライトパープル
            "#a0e7e5", // アクア
            "#b4f8c8", // ライトミント
            "#fbe7c6", // クリーム
            "#e2f0cb", // ペールグリーン
            "#c7ceea", // ペールブルー
          ],
        },
      ],
    },
    options: {
      layout: {
        padding: 10,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
              const percent = ((value / total) * 100).toFixed(1);

              return `${context.label}：¥${value.toLocaleString()} (${percent}%)`;
            },
          },
        },
      },
    },
  });
}

//ページ表示関数
function showPage(target) {
  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  const targetPage = document.getElementById(`${target}-page`);
  if (targetPage) {
    targetPage.classList.remove("hidden");
  }
}

//折れ線グラフ用データ集計
let lineChart;

function createMonthlyLineData(expenses, incomes) {
  const result = {};

  //支出まとめ
  expenses.forEach((e) => {
    const month = e.date.slice(0, 7);

    if (!result[month]) {
      result[month] = { income: 0, expense: 0 };
    }

    result[month].expense += e.amount;
  });

  //収入まとめ
  incomes.forEach((i) => {
    const month = i.date.slice(0, 7);

    if (!result[month]) {
      result[month] = { income: 0, expense: 0 };
    }
    result[month].income += i.amount;
  });

  return result;
}

//折れ線グラフ描画
function renderLineChart() {
  const ctxLine = document.getElementById("line-chart");

  const lineGraphData = createMonthlyLineData(expenses, incomes);
  const labels = Object.keys(lineGraphData).sort();

  const incomeData = labels.map((month) => lineGraphData[month].income);

  const expenseData = labels.map((month) => lineGraphData[month].expense);

  if (lineChart) {
    lineChart.destroy();
  }
  lineChart = new Chart(ctxLine, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "収入",
          data: incomeData,
          borderWidth: 2,
        },
        {
          label: "支出",
          data: expenseData,
          borderWidth: 2,
        },
      ],
    },
  });
}

//ページ切り替えボタン
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.page;

    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    showPage(target);

    if (target === "analytics") {
      setTimeout(() => {
        renderPieChart();
        renderLineChart();
      }, 100);
    }
  });
});

//使いすぎ/節約ランキングデータ集計
function getCategoryDiffRanking(expenses, expensesCategories, year, month) {
  let lastYear = year;
  let lastMonth = month - 1;

  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear--;
  }

  const result = [];

  expensesCategories
    .filter((c) => !c.isFixed)
    .forEach((category) => {
      const thisMonth = filterByMonth(
        expenses.filter((e) => e.categoryId === category.id),
        year,
        month,
      );

      const lastMonthData = filterByMonth(
        expenses.filter((e) => e.categoryId === category.id),
        lastYear,
        lastMonth,
      );

      const thisTotal = calcTotal(thisMonth);
      const lastTotal = calcTotal(lastMonthData);

      const diff = thisTotal - lastTotal;

      result.push({
        name: category.name,
        diff,
      });
    });

  return result;
}

//ランキング描画
function renderRanking() {
  const ranking = getCategoryDiffRanking(
    expenses,
    expensesCategories,
    currentYear,
    currentMonth,
  );

  const dangerIcons = ["💣", "💥", "🚨"];
  const medals = ["🥇", "🥈", "🥉"];

  const over = ranking
    .filter((r) => r.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);

  const good = ranking
    .filter((r) => r.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  const rankingEl = document.getElementById("ranking");

  rankingEl.innerHTML = `
    <h3 class="section-title">使いすぎTOP3</h3>
    ${over
      .map(
        (r, i) =>
          `<p>${dangerIcons[i]} ${r.name}：+¥${r.diff.toLocaleString()}</p>`,
      )
      .join("")}

    <h3 class="section-title">節約成功TOP3</h3>
    ${good
      .map(
        (r, i) =>
          `<p>${medals[i]} ${r.name}：-¥${Math.abs(r.diff).toLocaleString()}</p>`,
      )
      .join("")}
  `;
}

// カレンダー描画ゾーン
const calendarEl = document.getElementById("calendar");

function renderCalendar() {
  calendarEl.innerHTML = "";

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  //今月の1日が何曜日か
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  //今月が何日まであるか
  const lastDate = new Date(currentYear, currentMonth, 0).getDate();

  const header = document.createElement("div");
  header.classList.add("calendar-header");

  weekDays.forEach((day) => {
    const dayEl = document.createElement("div");
    dayEl.textContent = day;
    header.append(dayEl);
  });

  calendarEl.append(header);

  const grid = document.createElement("div");
  grid.classList.add("calendar-grid");

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("calendar-cell");
    grid.append(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");

    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dailyExpenses = expenses.filter((e) => e.date === dateStr);

    const dayEl = document.createElement("p");
    dayEl.textContent = day;

    cell.append(dayEl);

    if (dailyExpenses.length > 0) {
      const total = dailyExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      const totalEl = document.createElement("p");
      totalEl.textContent = `¥${total.toLocaleString()}`;
      totalEl.classList.add("calendar-total");

      cell.append(totalEl);
    }
    grid.append(cell);
  }
  calendarEl.append(grid);
}

//初期表示のrender必須！
render();
renderIncomeList();
toggleIncomeForm();
renderIncomeData();
renderCalendar();
