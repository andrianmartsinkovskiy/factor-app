const valuesRegExp = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g

const SORT_SECTION = document.getElementById("sort-section")
const PICKER_WRAP = document.getElementById("picker-wrap")
const SORT_SECTION_BTN = document.getElementById("sort-section-btn")
const FILTER_SECTION = document.getElementById("filter-section")
const FILTER_SECTION_BTN = document.getElementById("filter-section-btn")
const VIEW_CONTENT_HEADER = document.getElementById("view-content-header")
const TABLE = document.getElementById("view-content-table")
const TABLE_WRAP = document.getElementById("view-content")
const SELECT_WRAP = document.getElementById("sort-select-wrap")
const FILTER_SELECT_WRAP = document.getElementById("filter-select-wrap")
const FILTER_ELEMENTS = [
  {id: 1, name: "Distance", label: "distance", isSelected: false, weight: 1, min: "", max: ""},
  {id: 2, name: "Rank", label: "rank", isSelected: false, weight: 1, min: "", max: ""},
  {id: 3, name: "Air Per Students", label: "airPerStudents", isSelected: false, weight: 1, min: "", max: ""},
  {id: 4, name: "Faculty Ratio", label: "studentFacultyRatio", isSelected: false, weight: 1, min: "", max: ""},
  {id: 5, name: "Year Founded", label: "yearFounded", isSelected: false, weight: 1, min: "", max: ""},
  {id: 6, name: "Undergrad Pop", label: "undergradPop", isSelected: false, weight: 1, min: "", max: ""},
  {id: 7, name: "Base Salary", label: "medianBaseSalary", isSelected: false, weight: 1, min: "", max: ""},
]

/*

 */

let SELECTED_FILTER_ELEMENTS = [
  {factor: "", prefer: ""}
]
let ALL_ELEMENTS = []
let ACTIVE_ELEMENTS = []
const MAX_VALUES = {}

window.onload = () => {
  const reader = new FileReader()
  const picker = document.getElementById("picker")

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
      element.airPerStudents = Number(element.totalGrantAid) / Number(element.totalStudentPop)
      elements.push(element);
    }

    elements.shift()

    PICKER_WRAP.style.display = 'none'
    ALL_ELEMENTS = elements
    ACTIVE_ELEMENTS = elements
    renderLayout()
    getMaxValues()

  }
}

function filterElementsHandler () {
  const rangeValues = {}
  FILTER_ELEMENTS.forEach(item =>  {
    if (item.isSelected) {
      rangeValues[item.label] = {
        min: item.min,
        max: item.max
      }
    }
  })

  const newValues = ALL_ELEMENTS.filter(row => {
    let isActive = true

    Object.keys(row).forEach(key => {
      if (rangeValues[key]) {
        if (Number(row[key]) < Number(rangeValues[key].min)) {
          if (rangeValues[key].min !== '') {
            isActive = false
          }
        }
        if (Number(row[key]) > Number(rangeValues[key].max)) {
          if (rangeValues[key].max !== '') {
            isActive = false
          }
        }
      }
    })

    return isActive
  })

  ACTIVE_ELEMENTS = newValues
  calculateBlend()
  renderLayout()
}

function checkTableShow () {
  const selectedElements = SELECTED_FILTER_ELEMENTS.filter(item => {
    return !!item.factor && !!item.prefer
  })

  if (selectedElements.length) {
    TABLE_WRAP.style.display = 'grid'
  } else {
    TABLE_WRAP.style.display = 'none'
  }
}

function generateHeaderColumns () {
  // clear preview header
  const prevElements = document.getElementsByClassName("dynamic-header-column")
  const prevArr = Array.from(prevElements);
  prevArr.forEach(item => {
    item.remove()
  })

  // generate new headers
  FILTER_ELEMENTS
    .filter(item => item.isSelected)
    .map(item => {
      //create node
      const itemNode = document.createElement('div')
      itemNode.classList.add("dynamic-header-column")

      // create child nodes
      const itemNodeSpan = document.createElement("span")
      itemNodeSpan.innerText = item.name
      const itemNodeInput = document.createElement("input")
      itemNodeInput.type = 'range'
      itemNodeInput.id = item.label
      itemNodeInput.name = item.label
      itemNodeInput.min = '1'
      itemNodeInput.max = '10'
      itemNodeInput.value = item.weight
      itemNodeInput.onchange = e => {
        const elem =
          FILTER_ELEMENTS.find(elemItem => elemItem.label === e.target.id)
        elem.weight = e.target.value
        calculateBlend()
        renderLayout()
      }

      // add child nodes
      itemNode.appendChild(itemNodeSpan)
      itemNode.appendChild(itemNodeInput)

      // add to view
      VIEW_CONTENT_HEADER.appendChild(itemNode)
    })
}

function changeActiveSection (type){
  if (type === 'filter') {
    SORT_SECTION.style.display = 'none'
    SORT_SECTION_BTN.classList.remove("menu-section-bar_item-active")

    FILTER_SECTION.style.display = 'block'
    FILTER_SECTION_BTN.classList.add("menu-section-bar_item-active")
  } else {
    SORT_SECTION.style.display = 'block'
    SORT_SECTION_BTN.classList.add("menu-section-bar_item-active")

    FILTER_SECTION.style.display = 'none'
    FILTER_SECTION_BTN.classList.remove("menu-section-bar_item-active")
  }
}

function renderLayout () {
  const arr = ACTIVE_ELEMENTS
  // clear html
  TABLE.innerHTML = ''
  const proc = 100 / arr.length

  // crete new values
  arr.forEach((item, index) => {
    // create row node
    const node = document.createElement("div")
    node.classList.add("view-row")

    const dynamicValues = FILTER_ELEMENTS
      .filter(dynamicItem => dynamicItem.isSelected)
      .map(dynamicItem => {
        return item[dynamicItem.label]
      })

    const rowArr = [
      item.organizationName ?? '',
      item.stateCode ?? '',
      item.blend ?? '',
      ...dynamicValues
    ]



    rowArr.map((rowItem, rowIndex) => {
      const columnElement = document.createElement('div')
      columnElement.innerHTML = rowItem

      if (rowIndex === 2) {
        const colorVal = 1 - ((index * proc) / 100)
        columnElement.style.background = `rgba(20,84,187,${colorVal})`
      }

      node.appendChild(columnElement)
    })

    TABLE.appendChild(node)
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

  // if not have empty - create new item
  if (!isHaveEmpty && SELECTED_FILTER_ELEMENTS.length < 5) {
    SELECTED_FILTER_ELEMENTS.push({
      prefer: "",
      factor: ""
    })
  }


  // set selected prefer
  const selectedTypes = SELECTED_FILTER_ELEMENTS.map(item => item.factor)
  FILTER_ELEMENTS.forEach(item => {
    item.isSelected = selectedTypes.includes(item.label.toString())
  })


  // create header elements
  checkTableShow()
  calculateBlend()
  generateHeaderColumns()
  renderSelectSection()
  renderFilters()
  renderLayout()
}

function renderSelectSection () {
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
    option.value = item.label
    option.innerText = item.name
    option.disabled = item.isSelected
    select.appendChild(option)
  })
}

function getMaxValues () {
  ACTIVE_ELEMENTS.map(item => {
    FILTER_ELEMENTS.forEach(filterItem => {
      const label = filterItem.label


      if (MAX_VALUES[label] === undefined) {
        MAX_VALUES[label] = 0
      } else {
        if (Number(item[label] > MAX_VALUES[label])) {
          MAX_VALUES[label] = Number(item[label])
        }
      }
    })
  })

}

const calculateBlend = () => {
  let maxBlendValue = 0
  ACTIVE_ELEMENTS.forEach((item, index) => {
    let scoreFactor = 0
    SELECTED_FILTER_ELEMENTS
      .filter(el => !!el.prefer)
      .forEach(filterItem => {
        const label = filterItem.factor
        const filterElement = FILTER_ELEMENTS.find(filterEl => filterEl.label === label)

        let normalized = item[label] / MAX_VALUES[label]
        if (filterItem.prefer === "Low Values") {
          normalized = 1 - normalized
        }

        const weight = normalized * filterElement.weight
        scoreFactor = scoreFactor + Math.sqrt(weight)

      })
    item.blend = isNaN(scoreFactor) ? 0 : scoreFactor
    if (item.blend > maxBlendValue) {
      maxBlendValue = item.blend
    }
  })

  const onePercent = 100 / maxBlendValue

  ACTIVE_ELEMENTS = ACTIVE_ELEMENTS
    .map(item => {
      item.blend = onePercent * item.blend
      return item
    })
    .sort((a,b) => a.blend - b.blend).reverse()
}

function renderFilters () {
  // clear section
  FILTER_SELECT_WRAP.innerText = ''

  SELECTED_FILTER_ELEMENTS
    .forEach((item, index) => {
      // create parent node
      const selectWrap = document.createElement('div')
      selectWrap.classList.add("select-row")

      // crete selects
      const factorSelect = document.createElement('select')
      factorSelect.classList.add('select-default')
      factorSelect.name = 'select-filter-factor-name__' + index
      factorSelect.name = 'select-filter-factor-id__' + index
      factorSelect.onchange = onFilterSelectChange
      factorSelect.dataset.type = 'factor'
      addSelectOptionsHelper(factorSelect)

      // add values
      if (item.factor) {
        factorSelect.value = item.factor
      }


      // create inputs
      const inputWrap = document.createElement('div')
      const separatorDiv = document.createElement('div')
      separatorDiv.innerText = '-'
      separatorDiv.classList.add("separator-div")

      inputWrap.classList.add("select-input-wrap")
      const minInput = document.createElement('input')
      const maxInput = document.createElement('input')
      maxInput.classList.add("select-default")
      minInput.classList.add("select-default")
      minInput.onchange = changeFilterInput
      maxInput.onchange = changeFilterInput
      minInput.dataset.label = item.factor
      maxInput.dataset.label = item.factor
      minInput.dataset.type = 'min'
      maxInput.dataset.type = 'max'

      inputWrap.appendChild(minInput)
      inputWrap.appendChild(separatorDiv)
      inputWrap.appendChild(maxInput)


      selectWrap.appendChild(factorSelect)
      selectWrap.appendChild(inputWrap)
      FILTER_SELECT_WRAP.appendChild(selectWrap)
    })

}

function changeFilterInput (e) {
  const activeFilterElement = FILTER_ELEMENTS.find(item => item.label === e.target.dataset.label)
  const key = e.target.dataset.type
  activeFilterElement[key] = e.target.value


  filterElementsHandler()
}

function resetAllHandler () {
  SELECTED_FILTER_ELEMENTS = [{prefer: "", factor: ""}]

  TABLE_WRAP.style.display = 'none'
  renderLayout()
  renderSelectSection()
  renderFilters()
  generateHeaderColumns()
}

renderSelectSection()
renderFilters()

