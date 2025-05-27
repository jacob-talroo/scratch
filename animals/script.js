/* script.js */
(() => {
  const tree = {
    question: "does your animal have legs?",
    yes: {
      question: "does your animal have mane?",
      yes: { animal: "horse" },
      no:  { animal: "pig" }
    },
    no: { animal: "fish" }
  };

  let node, parent, lastAnswer;
  const messagesEl = document.getElementById('messages');
  const controlsEl = document.getElementById('controls');
  const treeEl = document.getElementById('tree');

  function countAnimals(subtree) {
    return subtree.question ? countAnimals(subtree.yes) + countAnimals(subtree.no) : 1;
  }

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

  function addMessage(text, sender = 'bot') {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function clearControls() {
    controlsEl.innerHTML = '';
  }

  function startGame() {
    node = tree; parent = null; lastAnswer = null;
    messagesEl.innerHTML = '';
    addMessage("i know all the animals in the world! think of an animal, and i'll figure it out.");
    addMessage(node.question);
    renderTree();
    showYesNo();
  }

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
    // Focus the first button
    if (btns.length > 0) btns[0].focus();
    // Keyboard navigation (left/right/enter)
    controlsEl.addEventListener('keydown', function handler(e) {
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
    });
  }

  function handleAnswer(answer) {
    addMessage(answer, 'user'); parent = node; lastAnswer = answer; node = node[answer];
    if (node.question) {
      addMessage(node.question);
      showYesNo();
    } else {
      askGuess();
    }
  }

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
          addMessage("i told that you i knew all of the animals!");
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
    // Focus the first button
    if (btns.length > 0) btns[0].focus();
    // Keyboard navigation (left/right/enter)
    controlsEl.addEventListener('keydown', function handler(e) {
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
    });
  }

  function learnAnimal() {
    addMessage("oh no! what animal were you thinking of?");
    clearControls();
    const input = document.createElement('input');
    input.placeholder = "your animal";
    input.className = 'pf-v5-c-form-control';
    input.style.marginRight = '10px';
    input.tabIndex = 0;
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

  function promptProperty(userAnimal) {
    addMessage(`what does a ${userAnimal} have that a ${node.animal} doesn't?`);
    clearControls();
    const input = document.createElement('input');
    input.placeholder = "property (e.g., fur, gills)";
    input.className = 'pf-v5-c-form-control';
    input.style.marginRight = '10px';
    input.tabIndex = 0;
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
      addMessage("got it! i'll remember that for next time.");
      const total = countAnimals(tree);
      addMessage(`i now know all ${total} animals in the world!`);
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

  document.addEventListener('DOMContentLoaded', startGame);
})();
