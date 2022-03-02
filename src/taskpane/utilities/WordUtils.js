
export default class WordUtils {
    
    static async insertWord(title, location, style) {
        await Word.run(function (context) {
    
            if (style.upperCase) {
                title = title.toUpperCase()
            }

            var docBody = context.document.body;
            context.load(docBody)
            
            return context.sync().then(function () {
                if (title.charAt(0) != " " && docBody.text != "" && docBody.text.charAt(docBody.text.length-1) != " ") {
                    docBody.insertText(" " + title, location)
                } else {
                    docBody.insertText(title, location)
                }
                
            })
        })
        .catch(function (error) {
                if (error instanceof OfficeExtension.Error) {
                        console.log("Debug info: " + JSON.stringify(error.debugInfo));
                }
        });
    }

    static trimThenInsert(title, location) {
        WordUtils.deleteWhiteSpace().then(function () {
            Word.run(function (context) {

                var docBody = context.document.body;
                docBody.insertText(title, location)
                
                return context.sync()
            })
            .catch(function (error) {
                    if (error instanceof OfficeExtension.Error) {
                            console.log("Debug info: " + JSON.stringify(error.debugInfo));
                    }
            });
        })
    }

    static async insertNewLine(repeats = 1) {
        for (var i = 0; i < repeats; i++) { 
            await Word.run(function (context) {
    
                var docBody = context.document.body;
                docBody.insertParagraph("", "End")
                
                return context.sync()
            })
            .catch(function (error) {
                if (error instanceof OfficeExtension.Error) {
                    console.log("Debug info: " + JSON.stringify(error.debugInfo));
                }
            });
        }
        
    }    

    static delete(string) {
        Word.run(function (context) {
      
          var searchResults = context.document.body.search(string, {ignorePunct: false});
          context.load(searchResults);
      
          return context.sync().then(function () {
      
              for (var i = 0; i < searchResults.items.length; i++) {
                    console.log("deleting: " + '"' + searchResults.items[i].text + '"')
                    searchResults.items[i].clear()
              }
      
              return context.sync();
          });  
      })
      .catch(function (error) {
          console.log('Error: ' + JSON.stringify(error));
          if (error instanceof OfficeExtension.Error) {
              console.log('Debug info: ' + JSON.stringify(errorw.debugInfo));
          }
      });
    }

    static async applyStyles(string, fontStyle) {
        
        if (string !== "") {
            await Word.run(function (context) {
      
                console.log("applying style to: " + '"' + string + '"')
                var searchResults = context.document.body.paragraphs.getLast().search(string, {ignorePunct: false});
                
                context.load(searchResults);
                searchResults.load("font")
            
                return context.sync().then(function () {            
                    for (var i = 0; i < searchResults.items.length; i++) {
                        // console.log("emboldening: " + '"' + searchResults.items[i].text + '"')

                        if (searchResults.items[i] != "" && i == searchResults.items.length-1) {
                            searchResults.items[i].font.bold = fontStyle.isBold
                            searchResults.items[i].font.italic = fontStyle.isItalic
                            searchResults.items[i].font.color = fontStyle.color
                            searchResults.items[i].font.size = fontStyle.size
                        } 
                    }
                });  
            })
            .catch(function (error) {
                // console.log('Error: ' + JSON.stringify(error));
            });
        }
    }

    static async applyStyleToSentence(index, style) {
        
        await Word.run(function (context) {
    
            let sentences = context.document.body.getRange("Whole").getTextRanges([",", ".", '?', '!', ':', ';'], true);
            context.load(sentences);
            
            return context.sync().then(function () {

                sentences.items[index].load("font")
                
                return context.sync().then(function () {
                    if (style.size != null) {
                        sentences.items[index].font.size = style.size
                    } else if (style.color != null) {
                        sentences.items[index].font.color = style.color
                    } else if (style.isBold != null) {
                        sentences.items[index].font.bold = style.isBold
                    } else if (style.isItalic != null) {
                        sentences.items[index].font.italic = style.isItalic
                    } else if (style.upperCase != null) {
                        if (style.upperCase) {
                            sentences.items[index].insertText(sentences.items[index].text.toUpperCase(), "Replace")
                        } else {
                            sentences.items[index].insertText(sentences.items[index].text.toLowerCase(), "Replace")
                        }
                    }
                    return context.sync()
                })
            }) 
        })
        .catch(function (error) {
            console.log('Error: ' + JSON.stringify(error));
        });
        
    }

    static async deleteLastSentence(repeats = 1, delimiters = [",", ".", '?', '!', ':', ';']) {
        for (var i = 0; i < repeats; i++) {
            await Word.run(function (context) {
                // let sentences = context.document.getSelection().getTextRanges([".", '?', '!', ':', ';', '\n', '\t', '\r'], false);
                let sentences = context.document.body.getRange("End").getTextRanges(delimiters, true);
                
                context.load(sentences);
                
                return context.sync().then(function () {

                    for (var i = 0; i < sentences.items.length; i++) {
                        try {
                            console.log("deleting sentence: " + sentences.items[i].text)
                            sentences.items[i].delete()
                            WordUtils.delete(sentences.items[i].text)
                          } catch (error) {
                            console.error("sentence is empty");
                          } 
                        
                        
                    }
                    
                    return context.sync()
                })
              })
        } 
    }

    static async selectSentence(index = -1, forward = true,  moveBy = 1, setIndex, finish = false) {
        
        await Word.run(function (context) {
            
            let sentences = context.document.body.getRange("Whole").getTextRanges([",", ".", '?', '!', ':', ';'], true);
            context.load(sentences);
            
            return context.sync().then(function () {

                for (var i = 0; i < sentences.items.length; i++) {
                    sentences.items[i].load("font")
                }
                
                return context.sync().then(function () {
                    if (finish) {
                        sentences.items[index].font.highlightColor = null
                        setIndex(-1)
                    } else if (index == -1) {
                        let newIndex = sentences.items.length - 1
                        sentences.items[newIndex].font.highlightColor = "yellow"
                        setIndex(newIndex)
                    } else if (moveBy == 0) {
                        sentences.items[index].font.highlightColor = "yellow"
                    } else {
                        if (forward) {
                            let newIndex = Math.min(sentences.items.length - 1, index + moveBy)
                            sentences.items[index].font.highlightColor = null
                            sentences.items[newIndex].font.highlightColor = "yellow"
                            setIndex(newIndex)
                        } else {
                            let newIndex = Math.max(0, index - moveBy)
                            sentences.items[index].font.highlightColor = null
                            sentences.items[newIndex].font.highlightColor = "yellow"
                            setIndex(newIndex)
                        }
                    }
                })
            })
        })
        
    }

    static async deleteSelectedSentence(index, setIndex) {
        
        await Word.run(function (context) {
            
            let sentences = context.document.body.getRange("Whole").getTextRanges([",", ".", '?', '!', ':', ';'], true);
            context.load(sentences);
            
            return context.sync().then(function () {

                sentences.items[index].delete()

                if (sentences.items.length-1 == index) {
                    setIndex(Math.max(0, index-1))
                } 
                
                
                return context.sync()
            })
        })
        
    }

    static async selectString(string, index = -1, forward = true,  moveBy = 1, setStringIndex, finish = false) {
        
        await Word.run(function (context) {
            
            console.log("SEARCHING: " + string)
            let searchResults = context.document.body.search(string,  {ignorePunct: true})
            context.load(searchResults);

            return context.sync().then(function () {
                
                for (var i = 0; i < searchResults.items.length; i++) {
                    console.log(searchResults.items[i].text)
                    searchResults.items[i].load("font")
                }
                
                return context.sync().then(function () {
                    
                    if (finish) {
                        searchResults.items[index].font.highlightColor = null
                        setStringIndex(-1)
                    } else if (index == -1) {
                        console.log("INDEX = -1: ")
                        let newIndex = searchResults.items.length - 1
                        console.log("newindex = " + newIndex)
                        searchResults.items[newIndex].font.highlightColor = "yellow"
                        setStringIndex(newIndex)
                    } else if (moveBy == 0) {
                        searchResults.items[index].font.highlightColor = "yellow"
                    } else {
                        if (forward) {
                            let newIndex = Math.min(searchResults.items.length - 1, index + moveBy)
                            searchResults.items[index].font.highlightColor = null
                            searchResults.items[newIndex].font.highlightColor = "yellow"
                            setStringIndex(newIndex)
                        } else {
                            let newIndex = Math.max(0, index - moveBy)
                            searchResults.items[index].font.highlightColor = null
                            searchResults.items[newIndex].font.highlightColor = "yellow"
                            setStringIndex(newIndex)
                        }
                    }
                })
            })
        }).catch(function (error) {
            console.log('Error: ' + JSON.stringify(error));
            if (error instanceof OfficeExtension.Error) {
                console.log('Debug info: ' + JSON.stringify(error.debugInfo));
            }
        });
        
    }

    static async deleteWhiteSpace() {
        
        await Word.run(function (context) {

            let sentences = context.document.body.paragraphs.getLast().getRange("End").getTextRanges([" "], false);
            context.load(sentences);
            
            return context.sync().then(function () {
                
                for (var i = 0; i < sentences.items.length; i++) {
                    sentences.items[i].load("font")
                }
                
                return context.sync().then(function () {
                    for (var i = 0; i < sentences.items.length; i++) {
                        if (sentences.items[i] != "") {
                            let style = {
                                isBold: sentences.items[i].font.bold,
                                isItalic: sentences.items[i].font.italic,
                                color: sentences.items[i].font.color,
                            }
                            let sentence = sentences.items[i].text.replace(/\s+/g, ' ').trim()
                            console.log("deleting whitespace: " + sentence)
                            if (sentence !== sentences.items[i].text) {
                                sentences.items[sentences.items.length-1].insertText(sentence, "Replace")
                                WordUtils.applyStyles(sentence, style)
                            }
                            
                        }       
                    }
                })
            })
        })
        
    }

    static async deleteLastWord(repeats = 1, trimSpacing = false) {
        for (var i = 0; i < repeats; i++) {                  
            await Word.run(function (context) {
                // let words = context.document.getSelection().getTextRanges([" "], false);
                let words = context.document.body.getRange("End").getTextRanges([" "], trimSpacing);
                context.load(words);
        
                return context.sync().then(function () {
                    for (var i = 0; i < words.items.length; i++) {  
                        console.log(words.items[i].text)              
                        words.items[i].delete()
                    }
                    
                    return context.sync()
                })
              })
        }
        
    }

    static deleteParagraph() {
        Word.run(function (context) {

            let paragraphs = context.document.body.paragraphs
            context.load(paragraphs);

            return context.sync().then(function () {

                paragraphs.items[paragraphs.items.length-1].delete()

                return context.sync().then(function () {
                    WordUtils.deleteLastWord()
                })
            });
        })
        .catch(function (error) {
            console.log('Error: ' + JSON.stringify(error));
            if (error instanceof OfficeExtension.Error) {
                console.log('Debug info: ' + JSON.stringify(error.debugInfo));
            }
        });
    }

    static async deleteLatestMatch(string) {
        await Word.run(function (context) {
      
          var searchResults = context.document.body.search(string, {ignorePunct: false});
          context.load(searchResults);
      
          return context.sync().then(function () {
              searchResults.items[searchResults.items.length-1].delete()
              return context.sync();
          });  
      })
      .catch(function (error) {
          console.log('Error: ' + JSON.stringify(error));
          if (error instanceof OfficeExtension.Error) {
              console.log('Debug info: ' + JSON.stringify(error.debugInfo));
          }
      });
    }

    static async deleteAndReplaceLatestMatch(string, replacement, style) {
        await Word.run(function (context) {
      
            if (style.upperCase) {
                replacement = replacement.toUpperCase();
            }
            var searchResults = context.document.body.search(string, {ignorePunct: false});
            context.load(searchResults);
        
            return context.sync().then(function () {
                console.log("search result: " + searchResults.items[searchResults.items.length-1])
                var result = searchResults.items[searchResults.items.length-1]
                if (result === undefined)
                    WordUtils.insertWord(replacement, "End", style)
                else
                    searchResults.items[searchResults.items.length-1].insertText(replacement, "Replace")

                return context.sync();
            });  
      })
      .catch(function (error) {
          console.log('Error: ' + JSON.stringify(error));
          if (error instanceof OfficeExtension.Error) {
              console.log('Debug info: ' + JSON.stringify(error.debugInfo));
          }
      });
    }
    
}

