// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const baseApiUrl = "https://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
let categories = [];

// Gets a random set of category Ids from API and returns 6 Ids in an array.
async function getCategoryIds() {
  try {
    const response = await fetch("https://jservice.io/api/random?count=100");

    if (!response.ok) {
      throw new Error("Failed to fetch data from the API");
    }
    const data = await response.json();
    const categoryIdsArr = data.map((item) => item.category_id);
    return categoryIdsArr.slice(0, NUM_CATEGORIES); // Get the first 6 IDs
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Return object with data about a category:
async function getCategory(catId) {
  try {
    const response = await fetch(`${baseApiUrl}category?id=${catId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch category data from the API");
    }

    const data = await response.json();
    const allClues = data.clues;
    const randomClues = _.sampleSize(allClues, NUM_CLUES_PER_CAT);
    const clues = randomClues.map((cat) => ({
      question: cat.question,
      answer: cat.answer,
      showing: null,
    }));

    return { title: data.title, clues };
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

// Fetch and store the category data with clues for all 6 categories
async function fetchAllCategories() {
  const categoryIds = await getCategoryIds();
  for (const catId of categoryIds) {
    const categoryData = await getCategory(catId);
    categories.push(categoryData);
  }
}

// Call the function to fetch all categories
fetchAllCategories()
  .then(() => {
    return(categories); // This will contain the data for all 6 categories with their 5 clues each.
  })
  .catch((error) => {
    console.error("Error:", error);
  });

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  //add titles to game

  $("#tableHeader").empty();
  let $tr = $("<tr>");

  for (category of categories) {
    $tr.append(
      $("<td>")
        .text(category.title.toUpperCase())
        .attr("class", "bg-info align-top")
    );
  }

  $("#tableHeader").append($tr);

  // add rows of questions to game

  $("#board tbody").empty();
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    for (let categoryIdx = 0; categoryIdx <= NUM_CLUES_PER_CAT; categoryIdx++) {
      let $td = $("<td>")
        .append(
          '<i class="fa-solid fa-circle-question fa-flip fa-2xl" style="color: #0d5be3;"></i>'
        )
        .attr("id", `${categoryIdx}-${clueIdx}`)
        .attr("class", "jeopardy-cell bg-info");
      $tr.append($td);
    }
    $("#board tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let id = evt.currentTarget.id;
  let [catId, clueId] = id.split("-");
  let clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
  } else {
    //ignore if already showing answer
    return;
  }
  $(`#${catId}-${clueId}`).html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  const loadingView = document.getElementById("loadingView");
  const gameView = document.getElementById("gameView");
  const startBtn = document.querySelector("#startBtn");
  loadingView.style.display = "block";
  gameView.style.display = "none";

  // startBtn.on("click", () => {
  //   setupAndStart();
  // });
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  const loadingView = document.getElementById("loadingView");
  const gameView = document.getElementById("gameView");
  loadingView.style.display = "none";
  gameView.style.display = "block";
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  // hideLoadingView();
  let catInfo = await getCategoryIds();
  const startBtn = document.querySelector("#startBtn");
  startBtn.innerText = "Restart!";
  fillTable(catInfo); //obj converted to list
}


/** On click of start / restart button, set up game. */
$("#startBtn").on("click", () => {
  location.reload().then(setupAndStart())
});

/** On page load, add event handler for clicking clues */

$(async function () {
  $("#board").on("click", "td", handleClick);
  setupAndStart();
  hideLoadingView();
});
