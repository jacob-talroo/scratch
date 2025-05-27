/* script.js */
(() => {
  // --- Persistence helpers ---
  const STORAGE_KEY = 'animal_guessing_game_tree';
  function saveTree() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
    } catch (e) {}
  }
  function loadTree() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }

  // --- Initial tree ---
  const defaultTree = {
    question: "does your animal have legs?",
    yes: {
      question: "does your animal have mane?",
      yes: { animal: "horse" },
      no:  { animal: "pig" }
    },
    no: { animal: "fish" }
  };
  let tree = loadTree() || defaultTree;
  let node, parent, lastAnswer;
  const messagesEl = document.getElementById('messages');
  const controlsEl = document.getElementById('controls');
  const treeEl = document.getElementById('tree');

  // --- Accessibility: focus management ---
  function focusFirstControl() {
    const first = controlsEl.querySelector('input,button');
    if (first) first.focus();
  }

  // --- Count animals in the tree ---
  function countAnimals(subtree) {
    return subtree.question ? countAnimals(subtree.yes) + countAnimals(subtree.no) : 1;
  }

  // --- Render the knowledge base tree ---
  function renderTree() {
    treeEl.innerHTML = '';
    function buildList(sub) {
      const ul = document.createElement('ul');
      if (sub.question) {
        const li = document.createElement('li'); li.textContent = sub.question; ul.appendChild(li);
        const yesLi = document.createElement('li'); yesLi.innerHTML = '<strong>Yes:</strong>'; yesLi.appendChild(buildList(sub.yes)); ul.appendChild(yesLi);
        const noLi  = document.createElement('li'); noLi.innerHTML  = '<strong>No:</strong>';  noLi.appendChild(buildList(sub.no));  ul.appendChild(noLi);
      } else {
        const li = document.createElement('li'); li.textContent = sub.animal; ul.appendChild(li);
      }
      return ul;
    }
    treeEl.appendChild(buildList(tree));
  }

  // --- Add a message to the chat area ---
  function addMessage(text, sender = 'bot', isAlert = false) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    if (isAlert) {
      div.className += ' pf-v5-c-alert pf-m-info';
      div.setAttribute('role', 'alert');
      div.innerHTML = `<span class="pf-v5-c-alert__icon"><i class="fas fa-info-circle" aria-hidden="true"></i></span> <span class="pf-v5-c-alert__title">${text}</span>`;
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // --- Clear controls ---
  function clearControls() {
    controlsEl.innerHTML = '';
  }

  // --- Start or restart the game ---
  function startGame() {
    node = tree; parent = null; lastAnswer = null;
    messagesEl.innerHTML = '';
    addMessage("i know all the animals in the world! think of an animal, and i'll figure it out.", 'bot', true);
    addMessage(node.question);
    renderTree();
    showYesNo();
    focusFirstControl();
  }

  // --- Show yes/no buttons ---
  function showYesNo() {
    clearControls();
    const btns = [];
    ['yes', 'no'].forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = 'pf-v5-c-button pf-m-primary focus-ring';
      btn.style.marginRight = '10px';
      btn.tabIndex = 0;
      btn.addEventListener('click', () => handleAnswer(ans));
      controlsEl.appendChild(btn);
      btns.push(btn);
    });
    if (btns.length > 0) btns[0].focus();
    controlsEl.onkeydown = function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const active = document.activeElement;
        const idx = btns.indexOf(active);
        if (idx !== -1) {
          let nextIdx;
          if (e.key === 'ArrowRight') {
            nextIdx = (idx + 1) % btns.length;
          } else if (e.key === 'ArrowLeft') {
            nextIdx = (idx - 1 + btns.length) % btns.length;
          }
          btns[nextIdx].focus();
          e.preventDefault();
        }
      } else if (e.key === 'Enter') {
        const active = document.activeElement;
        const idx = btns.indexOf(active);
        if (idx !== -1) {
          btns[idx].click();
          e.preventDefault();
        }
      }
    };
  }

  // --- Handle yes/no answer ---
  function handleAnswer(answer) {
    addMessage(answer, 'user'); parent = node; lastAnswer = answer; node = node[answer];
    if (node.question) {
      addMessage(node.question);
      showYesNo();
      focusFirstControl();
    } else {
      askGuess();
    }
  }

  // --- Ask if the guess is correct ---
  function askGuess() {
    addMessage(`is it a ${node.animal}?`);
    clearControls();
    const btns = [];
    ['yes', 'no'].forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = 'pf-v5-c-button pf-m-primary focus-ring';
      btn.style.marginRight = '10px';
      btn.tabIndex = 0;
      btn.addEventListener('click', () => {
        addMessage(ans, 'user');
        if (ans === 'yes') {
          addMessage("i told you i knew all of the animals!", 'bot', true);
          clearControls();
          const restart = document.createElement('button');
          restart.textContent = "play again";
          restart.className = 'pf-v5-c-button pf-m-secondary focus-ring';
          restart.tabIndex = 0;
          restart.addEventListener('click', startGame);
          controlsEl.appendChild(restart);
          restart.focus();
        } else {
          learnAnimal();
        }
      });
      controlsEl.appendChild(btn);
      btns.push(btn);
    });
    if (btns.length > 0) btns[0].focus();
    controlsEl.onkeydown = function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const active = document.activeElement;
        const idx = btns.indexOf(active);
        if (idx !== -1) {
          let nextIdx;
          if (e.key === 'ArrowRight') {
            nextIdx = (idx + 1) % btns.length;
          } else if (e.key === 'ArrowLeft') {
            nextIdx = (idx - 1 + btns.length) % btns.length;
          }
          btns[nextIdx].focus();
          e.preventDefault();
        }
      } else if (e.key === 'Enter') {
        const active = document.activeElement;
        const idx = btns.indexOf(active);
        if (idx !== -1) {
          btns[idx].click();
          e.preventDefault();
        }
      }
    };
  }

  // --- Learn a new animal ---
  function learnAnimal() {
    addMessage("oh no! what animal were you thinking of?");
    clearControls();
    const input = document.createElement('input');
    input.placeholder = "your animal";
    input.className = 'pf-v5-c-form-control';
    input.style.marginRight = '10px';
    input.tabIndex = 0;
    input.setAttribute('aria-label', 'Enter your animal');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
    const btn = document.createElement('button');
    btn.textContent = "submit";
    btn.className = 'pf-v5-c-button pf-m-primary';
    btn.tabIndex = 0;
    btn.addEventListener('click', () => {
      const animal = input.value.trim().toLowerCase(); if (!animal) return;
      addMessage(animal, 'user'); promptProperty(animal);
    });
    controlsEl.appendChild(input); controlsEl.appendChild(btn);
    input.focus();
  }

  // --- Prompt for distinguishing property ---
  function promptProperty(userAnimal) {
    addMessage(`what does a ${userAnimal} have that a ${node.animal} doesn't?`);
    clearControls();
    const input = document.createElement('input');
    input.placeholder = "property (e.g., fur, gills)";
    input.className = 'pf-v5-c-form-control';
    input.style.marginRight = '10px';
    input.tabIndex = 0;
    input.setAttribute('aria-label', 'Enter distinguishing property');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
    const btn = document.createElement('button');
    btn.textContent = "submit";
    btn.className = 'pf-v5-c-button pf-m-primary';
    btn.tabIndex = 0;
    btn.addEventListener('click', () => {
      const prop = input.value.trim().toLowerCase(); if (!prop) return;
      addMessage(prop, 'user');
      const question = `does your animal have ${prop}?`;
      parent[lastAnswer] = { question, yes: { animal: userAnimal }, no: { animal: node.animal } };
      addMessage("got it! i'll remember that for next time.", 'bot', true);
      const total = countAnimals(tree);
      addMessage(`i now know all ${total} animals in the world!`);
      saveTree();
      renderTree();
      clearControls();
      const restart = document.createElement('button'); restart.textContent = "play again";
      restart.className = 'pf-v5-c-button pf-m-secondary';
      restart.tabIndex = 0;
      restart.addEventListener('click', startGame);
      controlsEl.appendChild(restart);
      restart.focus();
    });
    controlsEl.appendChild(input); controlsEl.appendChild(btn);
    input.focus();
  }

  // --- Restart button in header ---
  document.getElementById('restartBtn').addEventListener('click', () => {
    // Reset to base state and clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    tree = JSON.parse(JSON.stringify(defaultTree));
    startGame();
  });

  // --- Start game on load ---
  document.addEventListener('DOMContentLoaded', startGame);
})();
