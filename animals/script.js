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
    // --- Ensure a blank spacer is always at the end for scroll targeting ---
    let spacer = document.getElementById('chat-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'chat-spacer';
      // Set spacer height to match the controls area for scroll targeting
      spacer.style.height = '64px'; // controls min-height is 64px
      spacer.style.width = '100%';
      spacer.style.flexShrink = '0';
      messagesEl.appendChild(spacer);
    } else {
      spacer.style.height = '64px'; // always ensure correct height
      messagesEl.appendChild(spacer); // move to end if needed
    }
    setTimeout(() => {
      spacer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 0);
  }

  // --- Clear controls ---
  function clearControls() {
    controlsEl.innerHTML = '';
  }

  // --- Add persistent input at bottom like ChatGPT, but keep quick reply buttons for yes/no ---
  function renderPersistentInput(placeholder = "Type your answer...", submitLabel = "Send", onSubmit) {
    // Only render input for free text answers (not for yes/no steps)
    clearControls();
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'pf-v5-c-form-control';
    input.tabIndex = 0;
    input.setAttribute('aria-label', placeholder);
    input.style.flex = '1 1 auto';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit(input.value.trim());
      }
    });
    controlsEl.appendChild(input);
    input.focus();
  }

  // --- Show yes/no buttons (quick replies) ---
  function showYesNo() {
    clearControls();
    const btns = [];
    ['yes', 'no'].forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = 'pf-v5-c-button pf-m-primary quick-reply focus-ring';
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
      btn.className = 'pf-v5-c-button pf-m-primary quick-reply focus-ring';
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
    renderPersistentInput('your animal', 'Submit', (animal) => {
      addMessage(animal, 'user');
      promptProperty(animal.toLowerCase());
    });
  }

  // --- Prompt for distinguishing property ---
  function promptProperty(userAnimal) {
    addMessage(`what does a ${userAnimal} have that a ${node.animal} doesn't?`);
    clearControls();
    renderPersistentInput('property (e.g., fur, gills)', 'Submit', (prop) => {
      addMessage(prop, 'user');
      const question = `does your animal have ${prop.toLowerCase()}?`;
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
  }

  // --- Restart button in header ---
  document.getElementById('restartBtn').addEventListener('click', () => {
    // Reset to base state and clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    tree = JSON.parse(JSON.stringify(defaultTree));
    startGame();
  });

  // --- Knowledge base toggle for mobile ---
  const toggleKbBtn = document.getElementById('toggleKbBtn');
  if (toggleKbBtn) {
    toggleKbBtn.addEventListener('click', () => {
      document.body.classList.toggle('show-knowledge-base');
      if (document.body.classList.contains('show-knowledge-base')) {
        setTimeout(() => {
          document.getElementById('tree').focus();
        }, 100);
      }
    });
  }
  // Hide knowledge base when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 700 && document.body.classList.contains('show-knowledge-base')) {
      const sidebar = document.querySelector('.pf-v6-l-split__item:last-child');
      const btn = document.getElementById('toggleKbBtn');
      const closeBtn = document.getElementById('closeKbBtn');
      if (sidebar && !sidebar.contains(e.target) && btn && !btn.contains(e.target)) {
        document.body.classList.remove('show-knowledge-base');
      }
    }
  });
  // --- Close button for knowledge base on mobile ---
  const closeKbBtn = document.getElementById('closeKbBtn');
  if (closeKbBtn) {
    closeKbBtn.addEventListener('click', () => {
      document.body.classList.remove('show-knowledge-base');
      toggleKbBtn && toggleKbBtn.focus();
    });
  }

  // --- Start game on load ---
  document.addEventListener('DOMContentLoaded', startGame);
})();
