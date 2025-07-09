let paragraphs = [];
let timer;
let timeLimit = 3;
let startTime;
let charactersTyped = 0;
const textarea = document.querySelector('textarea');
textarea.disabled = true;
let totalTime = 1;
const overlay = document.getElementById('loading-overlay');
let totalType=0;
let backspaceCount = 0; // Initialize backspace count

// Initialize priorities from sessionStorage
let priorities = JSON.parse(sessionStorage.getItem('wordPriorities') || '{}');

// Auto-resize textarea as user types
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Handle backspace count
textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        backspaceCount++;
    }
    totalTime = Math.floor((Date.now() - startTime) / 1000) || 1;
    totalType+=1;
});

document.getElementById('start-button').addEventListener('click', async () => {
    document.getElementById('start-button').textContent = 'Restart';
    timeLimit = parseInt(document.getElementById('time-select').value);
    overlay.style.display = 'flex'; // show loader
    document.getElementById('characters-typed').textContent = charactersTyped;
    document.getElementById('time-display').textContent = timeLimit;
    document.getElementById('time-taken').textContent = 0;
    document.getElementById('results').style.display = 'none';
    let x = await showRandomParagraph();
    overlay.style.display = 'none'; // hide loader
    startTime = Date.now();
    charactersTyped = 0;
    textarea.value = '';
    textarea.disabled = false;
    textarea.focus();
    clearInterval(timer);
    timer = setInterval(updateTime, 1000);
});


function calculateErrorStatistics(fullMistakes, halfMistakes) {
  const errorStats = {
    // Full mistake categories (A-category - 1 mark each)
    omissionCount: 0,           // A-i
    substitutionCount: 0,       // A-ii, A-iv  
    additionCount: 0,           // A-iii
    repetitionCount: 0,         // A-v
    incompleteWordCount: 0,     // A-vi
    
    // Half mistake categories (B-category - 0.5 marks each)
    spacingErrorCount: 0,       // B-i
    capitalizationCount: 0,     // B-ii
    punctuationErrorCount: 0,   // B-iii
    transpositionCount: 0,      // B-iv
    paragraphErrorCount: 0,     // B-v
    
    // Summary statistics
    totalFullMistakes: 0,
    totalHalfMistakes: 0,
    totalErrorPoints: 0
  };
  
  // Count full mistakes by category
  if (Array.isArray(fullMistakes)) {
  fullMistakes.forEach(mistake => {
    const errorType = mistake.error.toLowerCase();
    
    if (errorType.includes('omission')) {
      errorStats.omissionCount++;
    } else if (errorType.includes('substitution') || errorType.includes('spelling')) {
      errorStats.substitutionCount++;
    } else if (errorType.includes('addition')) {  
      errorStats.additionCount++;
    } else if (errorType.includes('repetition')) {
      errorStats.repetitionCount++;
    } else if (errorType.includes('incomplete')) {
      errorStats.incompleteWordCount++;
    }
  });
  }else {
    console.log("fullMistakes is not an array:", fullMistakes);
  }

  // Count half mistakes by category
  if (!Array.isArray(halfMistakes)) {
  halfMistakes.forEach(mistake => {
    const errorType = mistake.error.toLowerCase();
    
    if (errorType.includes('spacing')) {
      errorStats.spacingErrorCount++;
    } else if (errorType.includes('capitalisation') || errorType.includes('capitalization')) {
      errorStats.capitalizationCount++;
    } else if (errorType.includes('punctuation')) {
      errorStats.punctuationErrorCount++;
    } else if (errorType.includes('transposition')) {
      errorStats.transpositionCount++;
    } else if (errorType.includes('paragraph')) {
      errorStats.paragraphErrorCount++;
    }
  });
}else {
  //console.log("halfMistakes is not an array:", halfMistakes);
}
  // Calculate totals
  errorStats.totalFullMistakes = fullMistakes.length;
  errorStats.totalHalfMistakes = halfMistakes.length;
  errorStats.totalErrorPoints = errorStats.totalFullMistakes + (errorStats.totalHalfMistakes * 0.5);
  
  return errorStats;
}


function updateTime() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const remainingTime = timeLimit - elapsedTime;
    document.getElementById('time-display').textContent = remainingTime;
    if (remainingTime <= 0) {
        clearInterval(timer);
        textarea.disabled = true;
        document.getElementById('start-button').textContent = 'Start';
        const x = document.querySelector('textarea').value;
        const resultElements=evaluateTyping(document.getElementById('random-paragraph').textContent,x) ;
        document.getElementById('characters-typed').textContent = x.length;
        document.getElementById('time-taken').textContent = totalTime;
        const errorStats = calculateErrorStatistics(resultElements.fullMistakes, resultElements.halfMistakes);
        document.getElementById('omission').textContent= errorStats.omissionCount;
        document.getElementById('substitution').textContent= errorStats.substitutionCount;
        document.getElementById('addition').textContent= errorStats.additionCount;
        document.getElementById('repetition').textContent= errorStats.repetitionCount;
        document.getElementById('incomplete').textContent= errorStats.incompleteWordCount;
        document.getElementById('spacing').textContent= errorStats.spacingErrorCount;
        document.getElementById('capitalization').textContent= errorStats.capitalizationCount;
        document.getElementById('punctuation').textContent= errorStats.punctuationErrorCount;
        document.getElementById('transposition').textContent= errorStats.transpositionCount;
        document.getElementById('paragraphic').textContent= errorStats.paragraphErrorCount;
        document.getElementById('total-full').textContent = errorStats.totalFullMistakes;
        document.getElementById('total-half').textContent = errorStats.totalHalfMistakes;   
        document.getElementById('gross-speed').textContent = Math.floor((x.length / totalTime) * 13); // Calculate speed in characters per minute
        const errorPercent = calculateSSCErrorPercentage(document.getElementById('random-paragraph').textContent, resultElements.fullMistakes, resultElements.halfMistakes);
        document.getElementById('error-percentage').textContent = errorPercent.errorPercentage;
        document.getElementById('net-speed').textContent = Math.floor(Math.max(((errorPercent.totalWords - errorPercent.fullMistakePoints) / totalTime) * 60,0)); // Calculate net speed in characters per minute
        document.getElementById('total-given-keystrokes').textContent = document.getElementById('random-paragraph').textContent.length;
        document.getElementById('time-taken').textContent = totalTime;
        document.getElementById('backspace-count').textContent = backspaceCount;
        document.getElementById('results').style.display = 'grid';
        alert('Time is up! Your results are displayed below.');
    }
}



function calculateSSCErrorPercentage(masterText, fullMistakes, halfMistakes) {
  const masterWords = masterText.match(/[A-Za-z0-9']+/g) || [];
  const totalWords = masterWords.length;
  const fullMistakePoints = fullMistakes.length * 1.0;
  const halfMistakePoints = halfMistakes.length * 0.5;
  const totalErrorPoints = fullMistakePoints + halfMistakePoints;
  const errorPercentage = (fullMistakePoints / totalWords) * 100;
  
  return {
    totalWords,
    fullMistakePoints,
    totalErrorPoints,
    errorPercentage: parseFloat(errorPercentage.toFixed(2))
  };
}


function updateWordPriorities(wrongWords) {
    // Increase priority for current wrong words
    wrongWords.forEach(word => {
        priorities[word] = (priorities[word] || 0) + 2;
    });
    
    // Decrease priority for all other words
    Object.keys(priorities).forEach(word => {
        if (!wrongWords.includes(word)) {
            priorities[word] = Math.max((priorities[word] || 0) - 1, 0);
            if (priorities[word] === 0) delete priorities[word];
        }
    });

    // Save to sessionStorage
    sessionStorage.setItem('wordPriorities', JSON.stringify(priorities));
}

async function showRandomParagraph() {
    const priorityWords = Object.keys(priorities).slice(0, 10).join(', ');
    const prompt = `Write a realistic and natural everyday story paragraph of exactly 
                    ${Math.floor(timeLimit * 1.35)} characters (including spaces) that 
                    can be used in a typing test. The paragraph should flow like a short 
                    scene from daily life (such as walking to work, a small interaction, 
                    or a personal moment). The paragraph must naturally include the 
                    following words: ${priorityWords}. also make sure the text is still easily understandable 
                    and readable. Do not use any special characters or formatting symbols 
                    (like asterisks, underscores, emojis, or at signs). The output should 
                    be a single paragraph — no title, no heading, and no summary at the end. 
                    Only use English language. The paragraph should match the Staff Selection 
                    Commission (SSC) standard typing test difficulty level. Also, do not forget 
                    to strictly maintain the character length.`;
    const baseURL = window.location.origin.includes('127.0.0.1') ? 'http://localhost:3000' : '';
    return fetch(`${baseURL}/api/generate-paragraph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('random-paragraph').textContent = data.paragraph||"The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet and is often used as a typing test. It is a great way to practice your typing skills and improve your speed and accuracy. Remember to keep your fingers on the home row and use all your fingers while typing. Happy typing!";
    })
    .finally(() => {
        return 1;
    })
    ;
    

}




function tokenize(text) {
  return text.match(/[a-zA-Z0-9']+|[.,!?;:\-()'"]/g) || [];
}

function isPunctuation(token) {
  return /^[.,!?;:\-()'"]+$/.test(token);
}

/* -------------  Core alignment algorithm ------------------ */
 function evaluateTyping(masterText, typedText) {
  const fullMistakes = [];
  const halfMistakes = [];
  
  const masterTokens = tokenize(masterText);
  const typedTokens = tokenize(typedText);
  
  let m = 0; // master index  
  let t = 0; // typed index
  
  while (m < masterTokens.length || t < typedTokens.length) {
    
    /* ----- Handle end conditions ----- */
    if (t >= typedTokens.length) {
      // Remaining master tokens are omissions (A-i)
      const token = masterTokens[m];
      if (isPunctuation(token)) {
        halfMistakes.push({ word: token, error: 'Punctuation error' }); // B-iii
      } else {
        fullMistakes.push({ word: token, error: 'Omission of word' }); // A-i
      }
      m++;
      continue;
    }
    
    if (m >= masterTokens.length) {
      // Remaining typed tokens are additions (A-iii)
      const token = typedTokens[t];
      if (isPunctuation(token)) {
        halfMistakes.push({ word: token, error: 'Punctuation error' }); // B-iii
      } else {
        fullMistakes.push({ word: token, error: 'Addition of word' }); // A-iii
      }
      t++;
      continue;
    }
    
    const masterToken = masterTokens[m];
    const typedToken = typedTokens[t];
    
    /* ----- Exact match - no error ----- */
    if (masterToken === typedToken) {
      m++; t++;
      continue;
    }
    
    /* ----- Critical: Spacing error detection ----- */
    // Missing space: "hopeyou" should be "hope you" (B-i)
    if (m + 1 < masterTokens.length) {
      const combined = masterToken + masterTokens[m + 1];
      if (combined.toLowerCase() === typedToken.toLowerCase()) {
        halfMistakes.push({ word: typedToken, error: 'Spacing error' }); // B-i
        m += 2; // Skip both master tokens that were combined
        t++;
        continue;
      }
    }
    
    // Extra space: "qu ick" should be "quick" (B-i)  
    if (t + 1 < typedTokens.length) {
      const combined = typedTokens[t] + typedTokens[t + 1];
      if (combined.toLowerCase() === masterToken.toLowerCase()) {
        halfMistakes.push({ 
          word: typedTokens[t] + ' ' + typedTokens[t + 1], 
          error: 'Spacing error' 
        }); // B-i
        t += 2; // Skip both typed tokens that should be one
        m++;
        continue;
      }
    }
    
    /* ----- Advanced pattern detection ----- */
    // Look ahead for spacing errors across insertions
    for (let lookahead = 1; lookahead <= 5 && m + lookahead < masterTokens.length; lookahead++) {
      const futureToken = masterTokens[m + lookahead];
      if (futureToken + masterTokens[m + lookahead + 1] === typedToken) {
        // Found spacing error after some insertions
        halfMistakes.push({ word: typedToken, error: 'Spacing error' }); // B-i
        // Mark skipped tokens as additions
        for (let skip = 0; skip < lookahead; skip++) {
          fullMistakes.push({ word: masterTokens[m + skip], error: 'Omission of word' }); // A-i
        }
        m += lookahead + 2;
        t++;
        continue;
      }
    }
    
    /* ----- Repetition detection (A-v) ----- */
    if (t > 0 && typedTokens[t - 1] === typedToken) {
      fullMistakes.push({ word: typedToken, error: 'Repetition of word' }); // A-v
      t++;
      continue;
    }
    
    /* ----- Transposition detection (B-iv) ----- */
    if (m + 1 < masterTokens.length && 
        typedToken.toLowerCase() === masterTokens[m + 1].toLowerCase()) {
      halfMistakes.push({ word: typedToken, error: 'Transposition error' }); // B-iv
      fullMistakes.push({ word: masterToken, error: 'Omission of word' }); // A-i
      m += 2;
      t++;
      continue;
    }
    
    /* ----- Capitalization errors (B-ii) ----- */
    if (masterToken.toLowerCase() === typedToken.toLowerCase()) {
      halfMistakes.push({ word: typedToken, error: 'Wrong capitalisation' }); // B-ii
      m++; t++;
      continue;
    }
    
    /* ----- Punctuation errors (B-iii) ----- */
    if (isPunctuation(masterToken) || isPunctuation(typedToken)) {
      halfMistakes.push({ word: typedToken, error: 'Punctuation error' }); // B-iii
      m++; t++;
      continue;
    }
    
    /* ----- Incomplete words (A-vi) ----- */
    if ((masterToken.length > 1 && typedToken.length > 1) &&
        (masterToken.toLowerCase().startsWith(typedToken.toLowerCase()) ||
         typedToken.toLowerCase().startsWith(masterToken.toLowerCase()))) {
      fullMistakes.push({ word: typedToken, error: 'Incomplete word' }); // A-vi
      m++; t++;
      continue;
    }
    
    /* ----- Default: Spelling/Substitution (A-ii, A-iv) ----- */
    fullMistakes.push({ word: typedToken, error: 'Substitution of wrong word' }); // A-ii
    m++; t++;
  }
  
  return { fullMistakes, halfMistakes };
}