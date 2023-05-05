import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Assets } from "@peasy-lib/peasy-assets";
import { Input } from "@peasy-lib/peasy-input";
import { Chance } from "chance";

let chance = new Chance();

enum borderColor {
  normal = "#03f106",
  selected = "#c53701",
  highlighted = "#affaaf",
}

const model: any = {
  launch: (event: any, model: any) => {
    model.seed = Math.random() * Date.now();
    chance = new Chance(model.seed);
    //chance = new Chance(978215731746.3297);

    model.result = "PENDING";
    model.breach.isVisible = !model.breach.isVisible;
    setTimeout(() => {
      model.breach.onLoad(model.level);
    }, 200);
  },
  level: "easy",
  result: "waiting",
  seed: <any>undefined,
  breach: {
    version: "1.0.6",
    gamePaused: false,
    isHelpVisible: false,
    appwidth: 500,
    timeremaining: 10,
    get getTimeRemaining() {
      if (model.breach.timeremaining >= 10) {
        return model.breach.timeremaining.toString();
      } else {
        let rtrnSTring = model.breach.timeremaining.toString();
        return rtrnSTring.padStart(2, "0");
      }
    },
    timeIsRunning: false,
    timeHandler: 0,
    showFinalModal: false,
    showHelp: (event: any, model: any) => {
      if (model.breach.clickLock) return;
      model.breach.isHelpVisible = !model.breach.isHelpVisible;
      //pause timer
      model.breach.gamePaused = model.breach.isHelpVisible;
    },
    closeGame: () => {
      if (model.breach.clickLock) return;
      model.breach.isVisible = false;
    },
    done: () => {
      if (model.breach.clickLock) return;
      checkForVictory(true);
    },
    reset: () => {
      if (model.breach.clickLock) return;
      model.breach.isVisible = false;
      setTimeout(() => {
        model.breach.clickLock = false;
        model.breach.onLoad();
        model.breach.isVisible = true;
      }, 350);
    },
    matrixClick: (event: any, model: any, element: any, attribute: any, object: any) => {
      //local defines
      let square = model.sq;
      let localModel = object.$parent.$model.breach;
      let Arow = localModel.activeRow;
      let Acol = localModel.activeCol;

      //gaurd conditions
      if (localModel.clickLock) return;
      if (localModel.numGuesses >= localModel.maxNumGuesses) return;
      if (localModel.highlightToggle == "row" && square.row != Arow) return;
      if (localModel.highlightToggle == "col" && square.col != Acol) return;
      if (square.bordercolor != borderColor.normal) return;

      //cosmetic activities
      square.bordercolor = borderColor.selected;
      if (localModel.highlightToggle == "row") localModel.highlightToggle = "col";
      else localModel.highlightToggle = "row";
      resetHighlights();
      if (localModel.highlightToggle == "row") {
        setHighlight(localModel.highlightToggle, square.row);
        localModel.activeRow = square.row;
      } else {
        setHighlight(localModel.highlightToggle, square.col);
        localModel.activeCol = square.col;
      }

      //move data around
      localModel.guesses.push({ id: 2, value: square.value, vis: true });
      localModel.numGuesses++;

      checkGuesses();
      checkForVictory(false);
    },
    clickLock: false,
    numOfTargets: 0,
    maxNumGuesses: 4,
    burnoffTimer: 10,
    highlightToggle: "row",
    activeRow: 0,
    activeCol: 0,
    squares: <any>[],
    sequences: <any>[],
    rows: [],
    cols: [],
    guesses: [],
    numGuesses: 0,
    get guessSize() {
      let size = 25 - model.breach.numGuesses / 1.95;
      return `${size}px`;
    },
    get fontSize() {
      let size = 18 - model.breach.numGuesses / 1.95;
      return `${size}px`;
    },
    isVisible: false,
    initFlag: true,
    victoryStatus: "CANCELLED",
    onLoad: (diff: any) => {
      //clean out data first
      model.breach.sequences = [];
      model.breach.squares = [];
      model.breach.rows = [];
      model.breach.cols = [];
      model.breach.guesses = [];
      model.breach.numGuesses = 0;
      model.breach.highlightToggle = "row";
      model.breach.activeRow = 0;
      model.breach.activeCol = 0;
      model.breach.clickLock = false;
      model.breach.isHelpVisible = false;
      model.breach.showFinalModal = false;
      if (model.breach.timeHandler != 0) clearInterval(model.breach.timeHandler);
      model.breach.timeIsRunning = false;
      model.breach.timeHandler = 0;

      let loopIndexSeqEasy = 0;
      let loopIndexSeqOther = 0;
      let randomSequenceValues: Array<string>;

      //get difficulty
      switch (diff) {
        case "easy":
          loopIndexSeqEasy = 2;
          loopIndexSeqOther = 2;
          randomSequenceValues = getSequenceArray(3);
          model.breach.timeremaining = 30; //30
          model.breach.maxNumGuesses = 7;
          break;
        case "med":
          loopIndexSeqEasy = 2;
          loopIndexSeqOther = 3;
          randomSequenceValues = getSequenceArray(3);
          model.breach.timeremaining = 20;
          model.breach.maxNumGuesses = 6;
          break;
        case "hard":
          loopIndexSeqEasy = 3;
          loopIndexSeqOther = 3;
          randomSequenceValues = getSequenceArray(4);
          model.breach.timeremaining = 15;
          model.breach.maxNumGuesses = 5;
          break;
        default:
          console.log("difficulty is: ", diff);
          loopIndexSeqEasy = 2;
          loopIndexSeqOther = 2;
          randomSequenceValues = getSequenceArray(3);
          model.breach.timeremaining = 30;
          model.breach.maxNumGuesses = 7;
          break;
      }

      /*******************
      Setup Sequence View
      ********************/
      let tempValues: any = [];
      for (let index = 0; index < loopIndexSeqEasy; index++) {
        //insert random values from preselected random values
        tempValues.push({
          value: chance.pickone(randomSequenceValues),
          bordercolor: borderColor.normal,
          mEnter: (event: any, model: any) => {
            highlightMatrixSquares(model.unit.value);
            model.unit.bordercolor = borderColor.highlighted;
          },
          mExit: (event: any, model: any) => {
            unhighlightMatrixSquares(model.unit.value);
            model.unit.bordercolor = borderColor.normal;
            checkGuesses();
          },
        });
      }
      model.breach.sequences.push({
        id: 0,
        values: tempValues,
        status: "off",
        get getLamp() {
          if (this.values.every(val => val.bordercolor == borderColor.selected)) {
            this.status = "on";
            return -20;
          } else {
            this.status = "off";
            return 0;
          }
        },
      });

      do {
        tempValues = [];
        for (let index = 0; index < loopIndexSeqOther; index++) {
          //insert random values from preselected random values
          tempValues.push({
            value: chance.pickone(randomSequenceValues),
            bordercolor: borderColor.normal,
            mEnter: (event: any, model: any) => {
              highlightMatrixSquares(model.unit.value);
              model.unit.bordercolor = borderColor.highlighted;
            },
            mExit: (event: any, model: any) => {
              unhighlightMatrixSquares(model.unit.value);
              model.unit.bordercolor = borderColor.normal;
              checkGuesses();
            },
          });
        }
      } while (arrayEqualsCheck(tempValues, model.breach.sequences[0].values));
      model.breach.sequences.push({
        id: 1,
        values: tempValues,
        get getLamp() {
          if (this.values.every(val => val.bordercolor == borderColor.selected)) {
            this.status = "on";
            return -20;
          } else {
            this.status = "off";
            return 0;
          }
        },
      });

      do {
        tempValues = [];
        for (let index = 0; index < loopIndexSeqOther; index++) {
          //insert random values from preselected random values
          tempValues.push({
            bordercolor: borderColor.normal,
            value: chance.pickone(randomSequenceValues),
            mEnter: (event: any, model: any) => {
              highlightMatrixSquares(model.unit.value);
              model.unit.bordercolor = borderColor.highlighted;
            },
            mExit: (event: any, model: any) => {
              unhighlightMatrixSquares(model.unit.value);
              model.unit.bordercolor = borderColor.normal;
              checkGuesses();
            },
          });
        }
      } while (
        arrayEqualsCheck(tempValues, model.breach.sequences[0].values) &&
        arrayEqualsCheck(tempValues, model.breach.sequences[1].values)
      );
      model.breach.sequences.push({
        id: 2,
        values: tempValues,
        get getLamp() {
          if (this.values.every(val => val.bordercolor == borderColor.selected)) {
            this.status = "on";
            return -20;
          } else {
            this.status = "off";
            return 0;
          }
        },
      });

      //************************ */
      //setup matrix
      //************************ */
      tempValues = [];
      for (let index = 0; index < 25; index++) {
        let col = index % 5;
        let row = Math.floor(index / 5);
        model.breach.squares.push({
          id: index,
          value: chance.pickone(randomSequenceValues),
          bordercolor: borderColor.normal,
          row: row,
          col: col,
        });
      }

      //************************ */
      //setup rows/columns data
      //************************ */
      model.breach.rows.push({ id: 0, x: 15, y: 120, vis: true });
      model.breach.rows.push({ id: 1, x: 15, y: 157, vis: false });
      model.breach.rows.push({ id: 2, x: 15, y: 194, vis: false });
      model.breach.rows.push({ id: 3, x: 15, y: 231, vis: false });
      model.breach.rows.push({ id: 4, x: 15, y: 268, vis: false });
      model.breach.cols.push({ id: 0, y: 103, x: 60, vis: false });
      model.breach.cols.push({ id: 1, y: 103, x: 97, vis: false });
      model.breach.cols.push({ id: 2, y: 103, x: 134, vis: false });
      model.breach.cols.push({ id: 3, y: 103, x: 171, vis: false });
      model.breach.cols.push({ id: 4, y: 103, x: 207, vis: false });

      //start the game timer
      //reset game timer if already instanced
      if (model.breach.timeHandler != 0) {
        clearInterval(model.breach.timeHandler);
        model.breach.timeHandler = 0;
      }
      checkTime();
    },
    timeCheck: () => {
      if (!model.breach.timeIsRunning) {
        model.breach.timeIsRunning = true;
        model.breach.timeHandler = setInterval(() => {
          if (model.breach.timeremaining == 0) {
            model.breach.timeIsRunning = false;
            clearInterval(model.breach.timeHandler);
            model.breach.timeHandler = 0;
            checkForVictory(true);
          } else if (!model.breach.gamePaused) model.breach.timeremaining--;
        }, 1000);
      }
    },
  },
};
const template = `<div> 
<div class='controls'> 
    <div>Version: \${breach.version}</div> 
    <button \${click@=>launch}> launch minigame</button>
    <select>
        <option \${'easy' ==> level}>Easy</option>
        <option \${'med' ==> level}>Medium</option>
        <option \${'hard' ==> level}>Hard</option>
    </select>
    <input class="result" type="text" readonly \${value<==result}></input>  
    <div class="minigame" \${===breach.isVisible} style="width:\${breach.appwidth}px">
        <div style="width: 100%;height:10%; "><span class="game_title">Data Breach</span></div>
        <div style="width: 100%;height:10%; "><span class="game_subtitle">Decode the data sequence</span></div>
        <div class="pipFlex">
            <div class="pipButtons" \${click@=>breach.closeGame}>Exit</div>
            <div class="pipButtons" \${click@=>breach.showHelp}>Help</div>
        </div>
        <div class="pipFlex2">
            <div class="pipButtons" \${click@=>breach.reset}>Reset</div>
            <div class="pipButtons" \${click@=>breach.done}>Done</div>
        </div>
        <div class="timerflex">
            <span>Time Remaining</span>
            <span class="timer">0:\${breach.getTimeRemaining}</span>
        </div> 
        <div class="gameborderTitle">Code Matrix</div>
        <div class="gameborder">
            <div class="gamebox">
                <div class="rows" \${row<=*breach.rows:id}  style="position:fixed; top: \${row.y}px; left:  \${row.x}px;">
                    <div class="row" \${===row.vis}></div>
                </div>
                <div class="cols" \${col<=*breach.cols:id}  style="position:fixed; top: \${col.y}px; left:  \${col.x}px;">
                    <div class="col" \${===col.vis}></div>
                </div>
                <div class="matrixsquare" style="border: 1px solid \${sq.bordercolor}; color: \${sq.bordercolor}; "  \${click@=>breach.matrixClick} \${sq<=*breach.squares}>\${sq.value}</div>
            </div>
        </div>
        <div class="codesborderTitle">Sequences</div>
        <div class="codesborder">
            <div class="gamebox seqBox">
                <div class="sequence_flex" \${seq<=*breach.sequences}>
                  <div class="sequences">
                      <div class="hexstring" style="border: 1px solid \${unit.bordercolor}; color: \${unit.bordercolor}; " \${mouseenter@=>unit.mEnter} \${mouseleave@=>unit.mExit} \${unit<=*seq.values}>\${unit.value}</div>
                  </div>
                  <div class="lamp" style="background-position: \${seq.getLamp}px;"></div>
                </div>
                
           </div>
        </div>                
        <div class="guessFlex">
            <div class="guessDiv" style="width: \${breach.guessSize}; height: \${breach.guessSize}; font-size: \${breach.fontSize};" \${guess<=*breach.guesses}>\${guess.value}</div>
        </div>
        
        <div class="helpModal" \${===breach.isHelpVisible}>
          <div class="helpText">
            <p>Instructions: Objective of game is to find the code sequences in the code matrix.</p>
            <p>Controls: left click in the matrix to select a code to submit</p>
            <p>GamePlay: The object is to ultimately find ALL 3 code sequences in the matrix</p>
            <p>You will start with the top row in the matrix selected, and you can choose one of the codes in the row.</p>
            <p>Each time you select a code, the row/column highlight will toggle, enabling the next group of available codes</p>
            <p>As you complete sequences, the lamps will light.  The more lamps you light, the faster the game closes.</p>
          </div>
        </div>
        <div class="finalModal" \${===breach.showFinalModal}>
          <div class="modalText">\${breach.victoryStatus}</div>
        </div> 
    </div>
</div> 
</div>`;
UI.create(document.body, template, model);

function genRanHex(size) {
  return [...Array(size)]
    .map(() =>
      Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase()
    )
    .join("");
}

function getSequenceArray(numIndex: number): Array<string> {
  let tempArray: Array<string> = [];
  for (let index = 0; index < numIndex; index++) {
    let foundIndex;
    let tempSeq;
    //find tempSeq in randomSequnceValues
    do {
      tempSeq = genRanHex(2);
      foundIndex = tempArray.findIndex(s => s == tempSeq);
    } while (foundIndex != -1);
    tempArray.push(tempSeq);
  }
  return tempArray;
}

function resetHighlights() {
  model.breach.rows.forEach(r => (r.vis = false));
  model.breach.cols.forEach(c => (c.vis = false));
}

function setHighlight(dir: string, index: number) {
  if (dir == "row") {
    model.breach.rows[index].vis = true;
  } else {
    model.breach.cols[index].vis = true;
  }
}

function arrayEqualsCheck(a: Array<string>, b: Array<string>): boolean {
  // check the length
  if (a.length != b.length) {
    return false;
  } else {
    let result = false;

    // comparing each element of array
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      } else {
        result = true;
      }
    }
    return result;
  }
}

function highlightMatrixSquares(hVal: string) {
  model.breach.squares.forEach(sq => {
    if (sq.bordercolor != borderColor.selected && sq.value == hVal) {
      sq.bordercolor = borderColor.highlighted;
    }
  });
}

function unhighlightMatrixSquares(hVal: string) {
  model.breach.squares.forEach(sq => {
    if (sq.bordercolor != borderColor.selected && sq.value == hVal) {
      sq.bordercolor = borderColor.normal;
    }
  });
}

function checkGuesses() {
  let testString: string = "";
  model.breach.guesses.forEach(guess => (testString = testString.concat(guess.value)));

  //first sequence
  //model.breach.sequences[0]
  let searchString: string = "";
  for (let index = 0; index < model.breach.sequences[0].values.length; index++) {
    searchString = searchString.concat(model.breach.sequences[0].values[index].value);

    if (testString.includes(searchString)) {
      model.breach.sequences[0].values[index].bordercolor = borderColor.selected;
    } else {
      model.breach.sequences[0].values[index].bordercolor = borderColor.normal;
    }
  }

  //second sequence
  //model.breach.sequences[1]
  searchString = "";
  for (let index = 0; index < model.breach.sequences[1].values.length; index++) {
    searchString = searchString.concat(model.breach.sequences[1].values[index].value);

    if (testString.includes(searchString)) {
      model.breach.sequences[1].values[index].bordercolor = borderColor.selected;
    } else {
      model.breach.sequences[1].values[index].bordercolor = borderColor.normal;
    }
  }

  //third sequence
  //model.breach.sequences[2]
  searchString = "";
  for (let index = 0; index < model.breach.sequences[2].values.length; index++) {
    searchString = searchString.concat(model.breach.sequences[2].values[index].value);

    if (testString.includes(searchString)) {
      model.breach.sequences[2].values[index].bordercolor = borderColor.selected;
    } else {
      model.breach.sequences[2].values[index].bordercolor = borderColor.normal;
    }
  }
}

async function checkForVictory(isDone: boolean) {
  //game ends under X conditions
  /*
    -timer runs out
    -done button clicked
    -all 3 conditions met
  */
  console.log("here");

  if (!isDone) {
    //wait for peasy to update lamps
    await wait(25);
    if (returnLampStatus()) {
      //all 3 lamps lit, declare victory
      console.log("in lamps");
      model.breach.timeIsRunning = false;
      clearInterval(model.breach.timeHandler);
      model.breach.timeHandler = 0;
      model.breach.burnoffTimer = 2;
      model.breach.showFinalModal = true;
      model.breach.victoryStatus = `SUCCESS: ${model.breach.burnoffTimer}`;
      model.result = "SUCCESS";
      model.breach.clickLock = true;
      cookOffTimer();
      return;
    }
  } else {
    //done pressed
    //set burnoff timer
    let lampCount = 0;
    model.breach.sequences.forEach(seq => {
      if (seq.status == "on") lampCount++;
    });
    if (lampCount > 0) {
      //show ending modal
      if (lampCount == 1) model.breach.burnoffTimer = 12;
      else model.breach.burnoffTimer = 8;
      model.breach.showFinalModal = true;
      model.result = "SUCCESS";
      model.breach.victoryStatus = `SUCCESS: ${model.breach.burnoffTimer}`;
      model.breach.clickLock = true;
      cookOffTimer();
    } else {
      console.log("in teimer done");
      model.breach.burnoffTimer = 2;
      model.breach.showFinalModal = true;
      model.result = "FAIL";
      model.breach.victoryStatus = `FAIL: ${model.breach.burnoffTimer}`;
      model.breach.clickLock = true;
      cookOffTimer();
    }
  }
}

function returnLampStatus(): boolean {
  return model.breach.sequences.every(seq => seq.status === "on");
}

async function cookOffTimer() {
  for (let index = 0; index <= model.breach.burnoffTimer; index++) {
    await wait(1000);
    if (model.result == "SUCCESS") model.breach.victoryStatus = `SUCCESS: ${model.breach.burnoffTimer - index}`;
    else model.breach.victoryStatus = `FAIL: ${model.breach.burnoffTimer - index}`;
  }
  await 500;
  model.breach.showFinalModal = false;
  model.breach.isVisible = false;
  //burnoff done
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkTime() {
  model.breach.timeCheck();
}
