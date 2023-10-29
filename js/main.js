const valuesRegExp = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g

const TABLE = document.getElementById("view-content-table")
const SELECT_WRAP = document.getElementById("filter-select-wrap")
const FILTER_ELEMENTS = [
  {id: 1, name: "Distance", isSelected: false},
  {id: 2, name: "Rank", isSelected: false},
  {id: 3, name: "Air Per Students", isSelected: false},
  {id: 4, name: "Student Faculty Ratio", isSelected: false},
]

let SELECTED_FILTER_ELEMENTS = [
  {factor: "", prefer: ""}
]

window.onload = () => {
  const reader = new FileReader()
  const picker = document.getElementById("picker")
  const table = document.getElementById("result-table")

  // read csv
  picker.onchange = () => reader.readAsText(picker.files[0])


  // generate html
  reader.onloadend = () => {
    let csv = reader.result
    const arr = csv.split('\n');
    const headers = arr[0].split(',');

    let lines = csv.split(/(?:\r\n|\n)+/).filter(function(el) {return el.length !== 0})

    let elements = [];
    for (let i = 0; i < lines.length; i++) {
      let element = {};
      let j = 0;
      while (matches = valuesRegExp.exec(lines[i])) {
        var value = matches[1] || matches[2];
        value = value.replace(/\"\"/g, "\"");

        element[headers[j]] = value;
        j++;
      }
      element.blend = 0
      elements.push(element);
    }

    elements.shift()
    console.log(elements, 'elements')

    renderLayout(elements)
  }
}

function renderLayout (arr) {
  TABLE.innerHTML = ''

  const proc = 100 / arr.length

  arr.map((item, index) => {
    const node = document.createElement("div")
    node.classList.add("view-row")

    const rowArr = [
      item.organizationName ?? '',
      item.stateCode ?? '',
      item.blend ?? '',
      item.distance ?? '',
      item.rank ?? '',
      item.totalStudentPop ?? '',
      item.studentFacultyRatio ?? '',
    ]

    rowArr.map((rowItem, rowIndex) => {
      const columnElement = document.createElement('div')
      columnElement.innerHTML = rowItem

      if (rowIndex === 2) {
        const colorVal = 1 - ((index * proc) / 100)
        console.log(colorVal, 'colorVal')
        columnElement.style.background = `rgba(20,84,187,${colorVal})`
      }

      node.appendChild(columnElement)
    })

    TABLE.appendChild(node)

    console.log(rowArr, 'rowArr')
  })
}

function onFilterSelectChange (e) {
  const type = e.target.dataset.type
  const index = e.target.name.split("__")[1]
  SELECTED_FILTER_ELEMENTS[index][type] = e.target.value

  // check is have empty
  let isHaveEmpty = false

  SELECTED_FILTER_ELEMENTS.map(item => {
    if (!item.prefer || !item.factor) {
      isHaveEmpty = true
    }
  })


  if (!isHaveEmpty) {
    SELECTED_FILTER_ELEMENTS.push({
      prefer: "",
      factor: ""
    })
  }

  // set selected prefer
  const selectedTypes = SELECTED_FILTER_ELEMENTS.map(item => item.factor)

  FILTER_ELEMENTS.forEach(item => {
    item.isSelected = selectedTypes.includes(item.id.toString())
  })


  renderSelectSection()
}

function renderSelectSection () {
  console.log(SELECTED_FILTER_ELEMENTS, 's')
  SELECT_WRAP.innerText = ''
  SELECTED_FILTER_ELEMENTS.map((item, index) => {
    // create select wrap
    const selectWrap = document.createElement('div')
    selectWrap.classList.add("select-row")

    // crete selects
    const factorSelect = document.createElement('select')
    const preferSelect = document.createElement('select')

    factorSelect.classList.add('select-default')
    factorSelect.name = 'select-factor-name__' + index
    factorSelect.name = 'select-factor-id__' + index
    factorSelect.onchange = onFilterSelectChange
    factorSelect.dataset.type = 'factor'

    preferSelect.classList.add('select-default')
    preferSelect.name = 'select-prefer-name__' + index
    preferSelect.name = 'select-prefer-id__' + index
    preferSelect.onchange = onFilterSelectChange
    preferSelect.dataset.type = 'prefer'

    addSelectOptionsHelper(factorSelect)
    addDefaultOptionsToSelectHelper(preferSelect)

    // add values
    if (item.factor) {
      factorSelect.value = item.factor
    }

    if (item.prefer) {
      preferSelect.value = item.prefer
    }

    selectWrap.appendChild(factorSelect)
    selectWrap.appendChild(preferSelect)
    SELECT_WRAP.appendChild(selectWrap)
  })
}

function addDefaultOptionsToSelectHelper (select) {
  select.innerText = '';
  ['', 'Low Values', "High Values"].map(item => {
    const option = document.createElement("option")
    option.value = item
    option.innerText = item
    select.appendChild(option)
  })
}

function addSelectOptionsHelper (select) {
  select.innerText = '';

  const defaultOption = document.createElement("option")
  defaultOption.value = 'null'
  defaultOption.innerText = ''
  select.appendChild(defaultOption)

  FILTER_ELEMENTS.map(item => {
    const option = document.createElement("option")
    option.value = item.id
    option.innerText = item.name
    option.disabled = item.isSelected
    select.appendChild(option)
  })
}

renderSelectSection()