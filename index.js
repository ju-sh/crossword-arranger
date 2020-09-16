//XXX: Validate: Unique hint nos.
//XXX: Start over button
//XXX: Save
//XXX: Versioned save

/* No need to set input tags to read-only when not in chr/letter mode as
   clicking would lead to other changes anyway */

class Cell {
    constructor(cellId) {
        /**
         * id: Used to set the id of the DOM element corresponding
         * to the cell. The DOM node's id would be 'cell-<id>'.
         *
         * type: The current edit state of the cell.
         * Possible cell types are:
         *  - filled (solid cell)
         *  - empty (empty space)
         *  - text (editable cell with text)
         *  
         * hintNum: Hint number to be shown in top-left corner, if any.
         * `null` if no hint has been set.
         *
         * chr: Text present inside the cell.
         */
        this.id = cellId;       // type: str
        this.type = "text";     // Enum: Text, Filled, Empty
        this.hintNum = null;    // type: Optional[int]
        this.chr = '';          // type: str
    }

    static getCellId(idStr) {
        /* Convert the cell id from 'cell-num' format to num */
        return parseInt(idStr.split('-').pop());
    }

    createDOM() {
        /* Create and return corresponding DOM node */
        let cell = document.createElement('div');
        let hint = document.createElement('span');
        let chr = document.createElement('input');

        // Assign class
        cell.className = "cell";
        hint.className = "hint-num";
        chr.className = "letter";

        // Others
        cell.id = "cell-" + this.id;
        chr.maxLength=5;
        chr.style.overflow = "hidden";

        // InnerHTML
        if(this.hintNum != null) {
            hint.innerHTML = "<sup>" + this.hintNum + "</sup>";
        }
        chr.value = this.chr;

        // Attach in order
        cell.appendChild(hint);
        cell.appendChild(chr);

        return cell;
    }
}

class Crossword {
    /**
     * Represent a crossword along with its attributes.
     * 
     * DOM is not stored but can be accessed using HTML ids.
     */
    constructor(rows, cols) {
        /**
         * rows: Number of rows
         * cols: Number of columns
         * cells: An array of `Cell` objects corresponding to the cells
         * of the crossword
         * mode: Current edit mode of the crossword.
         * Possible values:
         *  - char (text-edit)
         *  - hint (hint-edit)
         *  - type (cell-type-edit)
         */
        this.rows = rows;       // type: int
        this.cols = cols;       // type: int
        this.cells = [];        // 2d int arr. Can be indexed by cell ID.
        this.mode = 'char';     // Enum: char entry, cell type edit, hint num edit. => 'char', 'type', 'hint'
    }

    createDOM() {
        /**
         * Create and return HTML node for the crossword
         */
        let crossword = document.createElement('div');
        crossword.id = "crossword";

        let totalCellCount = this.rows * this.cols;
        for(let i=0; i<totalCellCount; ++i) {
            let cell = new Cell(i); 
            let cellNode = cell.createDOM();
            cellNode.addEventListener('click', handleCellClick);
            crossword.appendChild(cellNode);
            this.cells.push(cell);
        }
        return crossword;
    }

    toggleCellChildrenVisibility(cellId) {
        /**
         * Show or hide children nodes of a cell node based on cellId
         */
        let cellNode = document.getElementById('cell-' + cellId);
        Array.from(cellNode.children).forEach(child => {
            child.classList.toggle("invisible");
        });
    }

    changeMode(newMode) {
        /**
         * Change mode of the crossword.
         */
        if(newMode == this.mode) {
            // Nothing to do
            return true;
        }

        // Changes to be made to revert to original state if needed
        if(this.mode == "hint") {
            let cells = document.getElementsByClassName('cell');
            Array.from(cells).forEach(cell => {
                let idx = Cell.getCellId(cell.id);
                this.cells[idx].hintNum = cell.children[1].value;
                cell.children[0].innerHTML = "<sup>" + this.cells[idx].hintNum + "</sup>";
                cell.children[1].value = this.cells[idx].chr;
                cell.children[0].style.visibility = "visible";   //span tag with hint-num
            });
        }

        if(newMode == "hint") {
            let cells = document.getElementsByClassName('cell');
            Array.from(cells).forEach(cell => {
                let idx = Cell.getCellId(cell.id);
                cell.children[0].style.visibility = "collapse";   //span tag with hint-num
                this.cells[idx].chr = cell.children[1].value;
                cell.children[1].value = this.cells[idx].hintNum;
            });

        } else if(newMode!="type" && newMode!="char") {
            return false;
        }
        let modeDescriptionDiv = document.getElementById("mode-description");
        modeDescriptionDiv.innerHTML = modeDescriptions[crossword.mode];
        this.mode = newMode;
        return true;
    }
    
    changeCellType(cellId) {
        /**
         * Change cell type if the crossword is in cell-type-edit mode.
         */
        if(this.mode != "type") {
            return false;
        }
        console.log(cellId);
        let cellNode = document.getElementById('cell-' + cellId);
        if(cellNode.classList.contains("filled")) {
            cellNode.classList.remove("filled");
            cellNode.classList.add("empty");
            console.log("type changed to: empty");
        } else if(cellNode.classList.contains("empty")) {
            cellNode.classList.remove("empty");
            this.toggleCellChildrenVisibility(cellId);
            console.log("type changed to: text");
        } else {    // text (fill cell with text mode)
            this.toggleCellChildrenVisibility(cellId);
            cellNode.classList.add("filled");
            console.log("type changed to: filled");
        }
        return true;
    }
}

function handleCellClick(event) {
    /**
     * Call `Crossword` object functions to handle click events
     * on its cells.
     */
    if(crossword.mode == "type") {
        let target = event.currentTarget;
        let cellId = Cell.getCellId(target.id);
        crossword.changeCellType(cellId);
    }
}

function handleModeChangeClick(event) {
    /**
     *  Handle the clicks on the 3 buttons used to change the crossword's
     *  mode.
     */
    let target = event.currentTarget;
    let currentActiveButtonId = "button-edit-" + crossword.mode;
    if(currentActiveButtonId == target.id) {
        return false;   // old mode itself
    }
    let currentActiveButton = document.getElementById(currentActiveButtonId);
    currentActiveButton.classList.toggle("active-button");
    console.log(target.id);
    if(target.id == "button-edit-hint") {
        crossword.changeMode("hint");
    } else if(target.id == "button-edit-type") {
        crossword.changeMode("type");
    } else if(target.id == "button-edit-char") {
        crossword.changeMode("char");
    }
    target.classList.toggle("active-button");
    return true;
}

// global variables
var crossword;
const hintModeDescription = `
Click on a cell to add or edit the hint number it contains.
`;
const typeModeDescription = `
Click on a cell to toggle between solid, empty and editable state.
`;
const charModeDescription = `
Click on a cell to edit its text content.
`;
const modeDescriptions = {
    // key values are possible values of `Crossword.mode`
    'hint': hintModeDescription,
    'type': typeModeDescription,
    'char': charModeDescription
};

window.addEventListener('DOMContentLoaded', initCrosswordUI);

function initCrosswordUI(event) {
    /*
     * Initialize and display the crossword's UI
     */
    const rows = 7;
    const cols = 6;
    crossword = new Crossword(rows, cols);    
    //crossword = new Crossword(3, 4);    
    crosswordNode = crossword.createDOM();
    crosswordNode.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    document.getElementById("wrapper").prepend(crosswordNode);
    modeSwitchButtons = document.getElementById("mode-switch-buttons");
    Array.from(modeSwitchButtons.children).forEach(button => {
        button.addEventListener('click', handleModeChangeClick);
    });
    let modeDescriptionDiv = document.getElementById("mode-description");
    modeDescriptionDiv.innerHTML = modeDescriptions[crossword.mode];
}
