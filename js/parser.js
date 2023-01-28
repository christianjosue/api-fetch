var parser = require('./grammar.js');
try {
    parser.parse(process.argv[2]);
} catch (e) {
    let response = `Parse error on line ${e.hash.loc.last_line}:<br>${process.argv[2]}<br>`;
    for (let i = 0; i <= e.hash.loc.last_column; i++) {
        if (i == e.hash.loc.last_column) {
            response += '^<br>Expecting ';
        } else {
            response += '-';
        }
    }
    e.hash.expected.forEach(exp => {
        response += `${exp}, `;
    });
    response += `got ${e.hash.token}`;
    console.log(response);
}