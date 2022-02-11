
import TruebarClient from "./truebar/TruebarClient.js"
import {Microphone} from "./truebar/Microphone.js";
import WordUtils from "./utilities/WordUtils.js"
import Utilities from "./utilities/Utilities.js"

let AppState = {
	truebarClient: undefined,
	microphone: undefined,
	sessionInfo: undefined,

	selectingSentence: false,
	selectingSentenceIndex: -1,

	oldInterim: "",
 	newInterim: "",

	intervalId: -1,

	fontStyle: {
		color: "black",
		isBold: false,
		isItalic: false,
		upperCase: false,
		size: 11
	}
}

/* global document, Office, Word */
Office.onReady((info) => {
	if (info.host === Office.HostType.Word) {

		// Determine if the user's version of Office supports all the Office.js APIs that are used in the tutorial.
		if (!Office.context.requirements.isSetSupported('WordApi', '1.3')) {
			console.log('Sorry. The tutorial add-in uses Word.js APIs that are not available in your version of Office.');
		}
	}
});


listenerSetup()


async function openSession() {
	AppState.sessionInfo = await AppState.truebarClient.openSession((msg) => {
		handleInterimMessage(msg)
	})
}

function isAuthError(isError) {
	if (isError) {
		document.getElementById("username").classList.add("is-invalid")
		document.getElementById("password").classList.add("is-invalid")
	} else {
		document.getElementById("username").classList.remove("is-invalid")
		document.getElementById("password").classList.remove("is-invalid")
	}
}

function setStartBreathing() {
	let btn = document.getElementById("startBtn")
	btn.classList.add("breathing-button")
	btn.innerText = "Povezovanje"
}

function showStop() {
	let btn = document.getElementById("startBtn")
	btn.style.display = "none"
	btn.innerText = "Start"
	btn.classList.remove("breathing-button")
	document.getElementById("stopBtn").style.display = "block"
}



function showStartBtn() {
	document.getElementById("startBtn").style.display = "block"
	document.getElementById("stopBtn").style.display = "none"
}

async function closeSession() {
	if (AppState.intervalId != -1)
		clearInterval(AppState.intervalId) 

	// Stop audio capturing
	if (AppState.microphone !== undefined) {
		await AppState.microphone.lockAudio();
	}

	// Request session closing and wait for all already sent audio data to finish processing
	if (AppState.truebarClient !== undefined) {
		let closeMsg = await AppState.truebarClient.closeSession();
		console.log("Session closed with message: " + closeMsg)
	}
}

function handleInterimMessage(message) {
	var content = message.transcript.content
	var array = JSON.parse(content);

	AppState.oldInterim = AppState.newInterim
	AppState.newInterim = ""

	for (let i = 0; i < array.length; i++) {
		let msg = array[i]
		// console.log(msg)
		
		if (msg.spaceBefore == true)
			AppState.newInterim += " " + msg.text
		else {
			AppState.newInterim += msg.text
		}
			
	}

	//check if commands are enabled
	if (message.isFinal) {

		if (localStorage["commands_enabled"] === "true") {
			let potentialCommand = AppState.newInterim.toLocaleLowerCase().replace(/[.!?,:;]/g, "")
			var finalString = potentialCommand.replace(/\s{2,}/g," ").trim();
	
			console.log("final string: " + finalString)
			let commands = finalString.split(" ")
			let size = commands.length

			if (AppState.selectingSentence) {
				handleSentenceSelectionCommands(commands)
			} else {
				if (commands[0] === "vejica") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert(",", "End")
					})
				} else if (commands[0] === "pika") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert(".", "End")
					})
				} else if (commands[0] === "vprašaj") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert("?", "End")
					})
				} else if (commands[0] === "klicaj") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert("!", "End")
					})
				} else if (commands[0] === "dvopičje") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert(":", "End")
					})
				} else if (commands[0] === "podpičje") {
					WordUtils.deleteLastWord(1).then(function () {
						WordUtils.trimThenInsert(";", "End")
					})
				} 
	
				else if (commands[0] === "velikost") {
					if (Utilities.isNumber(commands[1])) {
						WordUtils.deleteLastWord(2).then(function () {
							AppState.fontStyle.size = parseInt(Utilities.getNumber(commands[1]))
							WordUtils.deleteWhiteSpace()
						})
					} 
				} 
	
				else if (commands[0] === "briši" || commands[0] === "zbriši" || commands[0] === "pobriši" || commands[0] === "izbriši") {
		
					if (size == 1) {
						WordUtils.deleteLastWord(2)
					} else {
						if (Utilities.isNumber(commands[1])) {
							WordUtils.deleteLastWord(Utilities.getNumber(commands[1]) + 2).then(function () {
								WordUtils.deleteWhiteSpace()
							})
						}

						else if (commands[1] === "besedo" || commands[1] === "beseda" || commands[1] === "besede") {
							WordUtils.deleteLastWord(3)
						}
						else if (commands[1] === "stavek" || commands[1] === "stavke") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLastSentence(1, [",", ".", '?', '!', ':', ';']).then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						}
						else if (commands[1] === "poved" || commands[1] === "povedi") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLastSentence(1, [".", '?', '!']).then(function () {
									WordUtils.deleteWhiteSpace()
								})	
							})
						}
						else if (commands[1] === "odstavek" || commands[1] === "paragraf") {
							WordUtils.deleteParagraph()
						}
						else if (commands[1] === "vejico") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch(",").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} else if (commands[1] === "piko") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch(".").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} else if (commands[1] === "dvopičje") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch(":").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} else if (commands[1] === "vprašaj") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch("?").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} else if (commands[1] === "klicaj") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch("!").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} else if (commands[1] === "podpičje") {
							WordUtils.deleteLastWord(2).then(function () {
								WordUtils.deleteLatestMatch(";").then(function () {
									WordUtils.deleteWhiteSpace()
								})
							})
						} 
							
					}
				} 
				
				else if (commands[0] === "vklopi" || commands[0] === "vključi") {
					if (Utilities.getColor(commands[1]) != null) {
						WordUtils.deleteLastWord(2).then(function () {
							AppState.fontStyle.color = Utilities.getColor(commands[1])
							WordUtils.deleteWhiteSpace()
						})
					} else if (commands[1] == "velike" || commands[1] == "veliko" || commands[1] == "velika") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka")
						WordUtils.deleteLastWord(3).then(function () {
							AppState.fontStyle.upperCase = true
							WordUtils.deleteWhiteSpace()
						})
					} else if (commands[1] == "male" || commands[1] == "mali" || commands[1] == "malo") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.upperCase = false
								WordUtils.deleteWhiteSpace()
							})
						}
					} else if (commands[1] == "debele" || commands[1] == "krepke") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.isBold = true
								WordUtils.deleteWhiteSpace()
							})
						}
					} else if (commands[1] == "poševne" || commands[1] == "nagnjene") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.isItalic = true
								WordUtils.deleteWhiteSpace()
							})
						}
					}
				} 
				
				else if (commands[0] === "izklopi" || commands[0] === "izključi") {
					if (commands[1] == "velike" || commands[1] == "veliko" || commands[1] == "velika") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.upperCase = false
								WordUtils.deleteWhiteSpace()
							})	
						}
					} else if (commands[1] == "debele" || commands[1] == "krepke") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.isBold = false
								WordUtils.deleteWhiteSpace()
							})
						}
					} else if (commands[1] == "poševne" || commands[1] == "nagnjene") {
						if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
							WordUtils.deleteLastWord(3).then(function () {
								AppState.fontStyle.isItalic = false
								WordUtils.deleteWhiteSpace()
							})
						}
					}
				}
				else if (commands[0] === "izberi" || commands[0] === "zberi"|| commands[0] === "izbiraj" || commands[0] === "zbiraj") {
					if (commands[1] == "stavek" || commands[1] == "stavke") {
						WordUtils.deleteLastWord(2).then(function () {
							AppState.selectingSentence = true
							WordUtils.selectSentence(AppState.selectingSentenceIndex, true, 0, setIndex)
						})
					}	
				}
				else if (commands[0] === "nova" || commands[0] === "novo" || commands[0] === "nov") {
					if (commands[1] === "vrstica" || commands[1] === "vrsta") {
						WordUtils.deleteLastWord(2).then(function () {
							WordUtils.insertNewLine()
						})
					}
					else if (commands[1] === "odstavek" || commands[1] === "paragraf") {
						WordUtils.deleteLastWord(2).then(function () {
							WordUtils.insertNewLine(2)
						})
					}
						
				} else {
					handleInsertion(AppState.oldInterim, AppState.newInterim)
				}
			}
	
		} else {
			if (!AppState.selectingSentence)
				handleInsertion(AppState.oldInterim, AppState.newInterim)
		}

	} else {
		if (!AppState.selectingSentence)
			handleInsertion(AppState.oldInterim, AppState.newInterim)
	}

	if (message.isFinal == true) {
		AppState.oldInterim = ""
		AppState.newInterim = ""
	}

	// console.log("old: " + AppState.oldInterim)
	// console.log("new: " + AppState.newInterim)
}

function handleSentenceSelectionCommands(commands) {
	let style = {
		color: null,
		isBold: null,
		isItalic: null,
		upperCase: null,
		size: null
	}

	if (commands[0] === "naprej") {
		if (commands.length > 1 && Utilities.isNumber(commands[1])) {
			WordUtils.selectSentence(AppState.selectingSentenceIndex, true, Utilities.getNumber(commands[1]), setIndex)
		} else {
			WordUtils.selectSentence(AppState.selectingSentenceIndex, true, 1, setIndex)
		}
	}
	else if (commands[0] === "briši" || commands[0] === "zbriši" || commands[0] === "pobriši" || commands[0] === "izbriši") {
		WordUtils.deleteSelectedSentence(AppState.selectingSentenceIndex, setIndex).then(function () {
			WordUtils.selectSentence(AppState.selectingSentenceIndex, true, 0, setIndex)
		})
	}
	else if (commands[0] === "nazaj") {
		if (commands.length > 1 && Utilities.isNumber(commands[1])) {
			WordUtils.selectSentence(AppState.selectingSentenceIndex, false, Utilities.getNumber(commands[1]), setIndex)
		} else {
			WordUtils.selectSentence(AppState.selectingSentenceIndex, false, 1, setIndex)
		}
	} else if (commands[0] === "velikost") {
		if (Utilities.isNumber(commands[1])) {
			style.size = Utilities.getNumber(commands[1])
			WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
		} 
	} else if (commands[0] === "vklopi" || commands[0] === "vključi") {
		let color = Utilities.getColor(commands[1])
		if (color != null) {
			style.color = Utilities.getColor(commands[1])
			WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
		}
		else if (commands[1] == "velike" || commands[1] == "veliko" || commands[1] == "velika") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.upperCase = true
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "male" || commands[1] == "mali" || commands[1] == "malo") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.upperCase = false
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "debele" || commands[1] == "krepke") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.isBold = true
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "poševne" || commands[1] == "nagnjene") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.isItalic = true
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		}
	} else if (commands[0] === "izklopi" || commands[0] === "izključi") {
		if (commands[1] == "velike" || commands[1] == "veliko" || commands[1] == "velika") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.upperCase = false
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "male" || commands[1] == "mali" || commands[1] == "malo") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.upperCase = true
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "debele" || commands[1] == "krepke") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.isBold = false
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		} else if (commands[1] == "poševne" || commands[1] == "nagnjene") {
			if (commands[2] == "črke" || commands[2] == "črko" || commands[2] == "črka") {
				style.isItalic = false
				WordUtils.applyStyleToSentence(AppState.selectingSentenceIndex, style)
			}
		}
	} 
	else if (commands[0] === "končaj" || commands[0] === "konča" || commands[0] === "konec") {
		AppState.selectingSentence = false
		WordUtils.selectSentence(AppState.selectingSentenceIndex, false, 1, setIndex, true)
	}
}

function setIndex(newIndex) {
	AppState.selectingSentenceIndex = newIndex
}

function handleInsertion(old, newer) {
	if (old !== newer) {
		if (old === "") {
			console.log("inserting word")
			WordUtils.insertWord(newer, "End", AppState.fontStyle).then(function () {
				WordUtils.deleteWhiteSpace().then(function () {
					WordUtils.applyStyles(newer, AppState.fontStyle)
				})
			})
		} else {
			console.log("deletingandreplacing")
			WordUtils.deleteAndReplaceLatestMatch(old, newer, AppState.fontStyle).then(function () {
				WordUtils.deleteWhiteSpace().then(function () {
					WordUtils.applyStyles(newer, AppState.fontStyle)
				})
			})
		}
			
	}
}

async function createTruebarClient(isAuthError) {
	if (AppState.truebarClient == undefined) {

		var username = document.getElementById("username").value
		var password = document.getElementById("password").value

		AppState.truebarClient = await TruebarClient.build(
			"demo-auth.true-bar.si",
			443,
			"demo-api.true-bar.si",
			443,
			true,
			3000,
			username,
			password,
			isAuthError
		)

		isAuthError(false)

		handleStorageOnSuccess(username, password)
		handleUIOnSuccess()
		setConfigUI(AppState.truebarClient.configData)

		console.log("created truebarclient")
	}
}

function handleStorageOnSuccess(username, password) {
	// this is needed because a preson may click "zapomni si me" during typing in credentials, and this updates storage with correct values
	if (document.getElementById("rememberMe").checked) {
		var newAuth = { 'username': username, 'password': password }
		localStorage.setItem("auth", JSON.stringify(newAuth))
		localStorage.setItem("remember_me", true)
	} else {
		console.log("clearing auth from storage")
		localStorage.removeItem("auth")
		localStorage.setItem("remember_me", false)
	}
}

function handleUIOnSuccess() {
	document.getElementById("spinnerContainer").hidden = true
	document.getElementById("settingsContainer").hidden = false
	if (document.getElementById("collapseAuth").classList.contains("show")) {
		document.getElementById("authButton").click()
	}
	
}

async function updateConfig() {
	document.getElementById('updateConfigDiv').hidden = true
	document.getElementById('spinnerDiv').hidden = false

	await axios("https://demo-api.true-bar.si/api/client/configuration", {
		method: 'PATCH',
		headers: {Authorization: `Bearer ${AppState.truebarClient.auth.access_token}`},
		data: {
			transcriptionDoInterim: document.getElementById('transcriptionDoInterim').checked + "",
			transcriptionDoPunctuation: document.getElementById('transcriptionDoPunctuation').checked + "",
			transcriptionDoInterimPunctuation: document.getElementById('transcriptionDoInterimPunctuation').checked + "",
			transcriptionDoNormalisation: document.getElementById('transcriptionDoNormalisation').checked + "",
			transcriptionDoDictation: document.getElementById('transcriptionDoDictation').checked + "",
			transcriptionShowUnks: document.getElementById('transcriptionShowUnks').checked + "",
			transcriptionEndpointingType: document.getElementById('transcriptionEndpointingType').value,
		}
	})
	
	if (AppState.truebarClient != undefined && AppState.truebarClient.ws != undefined) {
		await closeSession().then(function () {
			openSession().then(function () {
				AppState.microphone.unlockAudio()
			})
		})
	} else {
		AppState.truebarClient.configData = await TruebarClient.getConfig(AppState.truebarClient.auth.access_token)
	}
	
	document.getElementById('updateConfigDiv').hidden = false
	document.getElementById('spinnerDiv').hidden = true
            
}

function setConfigUI(data) {
	$("#transcriptionDoInterim").prop('checked', data["transcriptionDoInterim"]);
	$("#transcriptionDoPunctuation").prop('checked', data["transcriptionDoPunctuation"]);
	$("#transcriptionDoInterimPunctuation").prop('checked', data["transcriptionDoInterimPunctuation"]);
	$("#transcriptionDoNormalisation").prop('checked', data["transcriptionDoNormalisation"]);
	$("#transcriptionDoDictation").prop('checked', data["transcriptionDoDictation"]);
	$("#transcriptionShowUnks").prop('checked', data["transcriptionShowUnks"]);
	var mySelect = document.getElementById("transcriptionEndpointingType");
	for (var i=0; i < data["transcriptionEndpointingTypeOptions"].length; i++) {
		var option = document.createElement("option");
		option.text = data["transcriptionEndpointingTypeOptions"][i];
		mySelect.add(option, mySelect[i]);

		if (option.text === data["transcriptionEndpointingType"]) {
			mySelect.value = option.text
		}
	}
}

function listenerSetup() {

	document.getElementById("startBtn").onclick = async () => {

		setStartBreathing()

		if (AppState.truebarClient == undefined) {
			await createTruebarClient(isAuthError)
		}
		
		await openSession()
	
		AppState.microphone = new Microphone();
		await AppState.microphone.initMicrophone(16000, 4096, (data) => {
			AppState.truebarClient.sendAudioChunk(data)
		})
	
		await AppState.microphone.unlockAudio().then(function () {
			showStop()
		})
	
		console.log("Session started")
	}

	document.getElementById("stopBtn").onclick = async () => {
		await closeSession().then(function () {
			showStartBtn()
		})
	}

	document.getElementById("updateConfig").onclick = async () => {
		updateConfig()
	}
	
	document.getElementById("settingsBtn").onclick = async () => {
		if (AppState.truebarClient == undefined) {
			await createTruebarClient(isAuthError)
		}
	}

// document.getElementById("deleteBtn").onclick = async () => {
// 	const string = document.getElementById("deleteWord").value
// 	WordUtils.deleteLatestMatch(string)
// }

// document.getElementById("testBtn").onclick = async () => {
// 	WordUtils.deleteWhiteSpace()
// }

// document.getElementById("delWord").onclick = async () => {
// 	WordUtils.deleteLastWord()
// }

}