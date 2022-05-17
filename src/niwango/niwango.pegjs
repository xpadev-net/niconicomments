Start = __ program:Program __ { return program; }

Program
  = body:SourceElements? {
      return {
        type: "Program",
        body: optionalList(body)
      };
    }
Expression
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / IDENT
  / STRING_SINGLE / STRING_DOUBLE
  / numeric
  / Comment

STRING_SINGLE = '\'' str:$(STRING_SINGLE_ELEMENT+) '\''{return {type:"Literal",raw:str}}
STRING_SINGLE_ELEMENT = !("'" / "\\") . {return text()}
STRING_DOUBLE = '\"' str:$(STRING_DOUBLE_ELEMENT+) '\"'{return {type:"Literal",raw:str.replace(/\\b/g,"\b").replace(/\\t/g,"\t").replace(/\\n/g,"\n").replace(/\\f/g,"\f").replace(/\\r/g,"\r")}}
STRING_DOUBLE_ELEMENT = ESC_SEQ / !('\\' / '"' / '\r' / '\n') . {return text()}

ESC_SEQ = '\\'('b'/'t'/'n'/'f'/'r'/'"'/'\''/'\\')?

IDENT = identifier:$(LETTER (LETTER / DIGIT)+){return {type:"Identifier",raw:identifier}}

LETTER
  = [a-zA-Z_@$]

numeric
  = numeric:$(OCT_LITERAL
  / HEX_LITERAL
  / FLOAT_LITERAL
  / INT_LITERAL){return {type:"Literal",}}

OCT_LITERAL = "0"digits:$([0-7]+){return parseInt(digits,8)}
HEX_LITERAL = "0x"i digits:$([0-9a-f]+){return parseInt("0x"+digits,16);}
FLOAT_LITERAL = float:$(INT_LITERAL FRAC DIGIT+){return parseFloat(float)}
INT_LITERAL = digits:$(SIGNE DIGIT+){return parseInt(digits,10)} / digits:$(DIGIT+){return parseInt(digits,10)}
DIGIT = [0-9]
SIGNE = "+" / "-"
FRAC = "."

WhiteSpace "whitespace" = "\t" / "\v" / "\f" / " " / "\u00A0" / "\uFEFF" / Zs
LineTerminator = [\n\r\u2028\u2029]
Comment
  = $("#" (!LineTerminator SourceCharacter)*){return}
SourceCharacter
  = .
__
  = (WhiteSpace / LineTerminatorSequence / Comment)*
_
  = (WhiteSpace / Comment)*