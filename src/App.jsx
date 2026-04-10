import { use } from 'react';
import './App.css'
import { useRef, useState, useEffect } from 'react';


export default function App() {
	console.log("App rendered");

	const audioCtx = useRef(null);
	const audioAnalyser = useRef(null);
	const stream = useRef(null);
	const source = useRef(null);
	const canvasRef = useRef(null);
	// const canvasCtx = useRef(null);
	const maxValRef = useRef(0);
	const maxIndexRef = useRef(0);
	const frequencyValueRef = useRef(null);
	const frequencyIndexRef = useRef(null);

	const oscRef = useRef(null);
	const oscGainRef = useRef(null);
	const [testFreq, setTestFreq] = useState(440);

	const [isMonitoring, setIsMonitoring] = useState(false);
	const updateAudioAnaylserRef = useRef(null);
	const dataArrayRef = useRef(null);

	const [mics, setMics] = useState([]);
	const [selectedMic, setSelectedMic] = useState('');
	const [selectedFftSize, setSelectedFftSize] = useState(4096);
	const [noiseGate, setNoiseGate] = useState(100);
	const [canvasType, setCanvasType] = useState("Snake");

	const[maxNoteVal, setMaxNoteVal] = useState(100)
	const[minNoteVal, setMinNoteVal] = useState(58)
	const[totalNote, setTotalNote] = useState(maxNoteVal-minNoteVal)
	const[snakeLength, setSnakeLength] = useState(58)
	

	const canvasConWinSize = useRef({
		width: null,
		height: null
	})
	const [canvasSize, setCanvasSize] = useState({
		width: 0,
		height: 0
	})

	// for Canvas 2 Snake
	const snakePositionRef = useRef([{ x: 0, y: 0 }]);
	
	// for Utils
	const liveSettingUtils = useRef(null)

	// for handling inputs
	const updateNoiseGate = (event) => {
	console.log("update Noise Gate");
		setNoiseGate(parseInt(event.target.value));
		// console.log("NoiseGate: "+NoiseGate);
	}
	const handleFftSize = (e) => {
	// console.log("handle FFT Size");
		console.log('handle FFt Size')
		// console.log(audioAnalyser.current)
	};

	// we will start from here
	// let startAudioData = {}
	const startAudioDataRef = useRef(null)
	const updateAudioAnaylserDataRef = useRef(null)
	// let updateAudioAnaylserData = {}
	

	useEffect(()=>{

		
	console.log("useEffect 1");
		console.log("useEffect: ", testFreq, ",", selectedMic, ",", selectedFftSize, ",", noiseGate, ",", canvasType, ",", maxNoteVal, ",", minNoteVal, ",", snakeLength);
		liveSettingUtils.current = {
			testFreq,
			isMonitoring,
			selectedMic,
			selectedFftSize,
			noiseGate,
			canvasType,
			maxNoteVal,
			minNoteVal,
			totalNote,
			snakeLength
		}
		// console.log("liveSettingUtils: ", liveSettingUtils.current);
		if (canvasRef.current) {
			startAudioDataRef.current = {
				canvasRef,
				liveSettingUtils, 
				audioCtx, 
				audioAnalyser, 
				stream, 
				source, 
				updateAudioAnaylserRef,
				updateAudioAnaylserDataRef,
				dataArrayRef,
				setIsMonitoring, 
				maxValRef, 
				maxIndexRef, 
				frequencyValueRef, 
				frequencyIndexRef, 
				setNoiseGate, 
				snakePositionRef, 
				oscRef, 
				oscGainRef
			}
		// console.log("startAudioDataRef: ", startAudioDataRef.current);
		}// Special case: If FFT size changes, the Analyser needs a physical update
		if (audioAnalyser.current && audioAnalyser.current.fftSize !== selectedFftSize) {
			audioAnalyser.current.fftSize = selectedFftSize;
			dataArrayRef.current = new Uint8Array(audioAnalyser.current.frequencyBinCount);
		}
		if (isMonitoring) {
			handleMonitoring();
		}
	}, [	
			testFreq,
			selectedMic,
			selectedFftSize,
			noiseGate,
			canvasType,
			maxNoteVal,
			minNoteVal,
			snakeLength
		]
	)

	const handleMonitoring = (event) => {
	console.log("handleMonitoring");
		// event.preventDefault();
		// console.log("handleMonitoring: ", startAudioData);
		// console.log("isMonitoring: ", isMonitoring);
		let monitoring = isMonitoring;
		// cancelAnimationFrame(updateAudioAnaylserRef.current);
		
		if (event) {
			console.log("event");
			setIsMonitoring(pre=>!pre);
			monitoring = !monitoring;
			// console.log("ismonitoring: ", isMonitoring, "pre: ", monitoring);
		}
		if (monitoring) {
			// console.log("handleMonitoring: ", startAudioDataRef.current);
			// cancelAnimationFrame(updateAudioAnaylserRef.current);
			startAudio(startAudioDataRef.current);
			console.log("if monitoring: ", monitoring);
			// setIsMonitoring(true);
		} else {
			// if (oscRef.current) {
			// 	oscRef.current.stop();
			// 	oscRef.current.disconnect();
			// }
			if (stream.current) {
				stream.current.getTracks().forEach(track => track.stop());
				console.log(" else monitoring: ", monitoring);
			}
			
		}
	}
	
	// This runs once when the app loads to find your earphones
	useEffect(() => {
		
	console.log("useEffect 2");
		navigator.mediaDevices.enumerateDevices().then(devices => {
			const audioInputs = devices.filter(device => device.kind === 'audioinput');
			setMics(audioInputs);
			if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);
		});
		
	}, []);
// resize observer for canvas container
	useEffect(()=>{
		
	console.log("useEffect 3");
		const resizeObserver = new ResizeObserver((entries)=>{
			for(let entry of entries) {

				const {width, height} = entry.contentRect
				
				setCanvasSize({width ,height})
			}
		})
		if (canvasConWinSize.current) {
			resizeObserver.observe(canvasConWinSize.current)
		}

		return ()=> resizeObserver.disconnect()
	},[])
// canvas zoom and snake length control
	useEffect(()=>{
	console.log("useEffect 4");
		const handleWheel = (e) => {
			if (e.ctrlKey) e.preventDefault();
			canvasZoom(e);
		};

		canvasRef.current.addEventListener('wheel', (e)=>canvasZoom(e), {passive: false})

		return canvasRef.current.removeEventListener('wheel', handleWheel)
	
	},[])
	const canvasZoom = (e) => {
	console.log("canvasZoom");
		e.preventDefault()
		
		if (e.ctrlKey) {
			if (e.deltaY<0 && minNoteVal>0 && maxNoteVal<136 && minNoteVal < maxNoteVal){
				setMaxNoteVal(pre=>pre+1)
				setMinNoteVal(pre=>pre-1)
			} 
			if (e.deltaY>0 && maxNoteVal<136 && minNoteVal>0 && minNoteVal < maxNoteVal) {
				setMaxNoteVal(pre=>pre-1)
				setMinNoteVal(pre=>pre+1)
			}
			setTotalNote(maxNoteVal-minNoteVal)
			console.log("max: "+maxNoteVal, "min: "+minNoteVal, "total: "+totalNote)
		}
		if (e.shiftKey) {
			if (snakeLength > 0 && snakeLength<1000) {
				if (e.deltaY<0){
					setSnakeLength(pre=>pre-2)
					console.log("snakeLength-: "+snakeLength)
				}
				if (e.deltaY>0){
					setSnakeLength(pre=>pre+2)
					console.log("snakeLength+: "+snakeLength)
				}
			}
		}
	}


	return (<>
		<div className="App">
			<nav>
				<div className="micOptCon">
					<div className="micOptTitle">Mic Input</div>
					<select className='micOpt' onChange={(e) => handleFftSize(e)} value={selectedMic}>
						{mics.map(mic => (
							<option key={mic.deviceId} value={mic.deviceId}>
								{mic.label || `Microphone ${mic.deviceId}`}
							</option>
						))}
					</select>
				</div>
				<div className="micOptCon">
					<div className="micOptTitle">FFT Size</div>
					<select name="fftSize" id="" onChange={(e) => setSelectedFftSize(parseInt(e.target.value))} value={selectedFftSize}>
						<option value="256">256</option>
						<option value="512">512</option>
						<option value="1024">1024</option>
						<option value="2048">2048</option>
						<option value="4096">4096</option>
						<option value="8192">8192</option>
					</select>
				</div>
				<div className="micOptCon">
					<div className="micOptTitle">Canvas Mode</div>
					<select name="canvasType" id="" onChange={(e) => setCanvasType(e.target.value)} value={canvasType}>
						<option value="Static">Static</option>
						<option value="Snake">Snake</option>
						<option value="Test">Test</option>
					</select>
				</div>
				<div className="">

					<div className="">
						<span className="">Noise Gate</span>
						<input type="range" onChange={(event) => updateNoiseGate(event)} value={noiseGate} min="0" max="255" step="1" className="noise-gate-slider" />
					</div>
					
				</div>
			</nav>
			{/* <button style={{width:"fit-content"}} className="" onClick={() => startAudio(startAudioData)}>Start Monitoring</button> */}
			<button style={{width:"fit-content"}} className="" onClick={(event) => handleMonitoring(event)}>Start Monitoring</button>
			<div className="">connect audioContext and give mic permission.</div>
			<div ref={canvasConWinSize} className="canvasCon">

				<canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} 
					style={{display:"block", maxHeight: "100%", maxWidth: "100%" }} className="audio-canvas"
				></canvas>
			</div>
			<div className="test-controls">
				<span>Test Tone (Hz): {testFreq}</span>
				<input 
					type="range" 
					min="100" max="1000" 
					value={testFreq} 
					onChange={(e) => {
						const val = parseFloat(e.target.value);
						setTestFreq(val);
						if(oscRef.current) oscRef.current.frequency.setTargetAtTime(val, audioCtx.current.currentTime, 0.1);
					}} 
				/>
				<button 
					onMouseDown={() => oscGainRef.current.gain.setTargetAtTime(0.1, audioCtx.current.currentTime, 0.05)}
					onMouseUp={() => oscGainRef.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 0.05)}
				>
					Hold to Hear Synth
				</button>
			</div>
		</div>
	</>)  	
}

const startAudio = async  (startAudioData) => {
	
	console.log("startAudio");
	const {
		liveSettingUtils, 
		audioCtx, 
		canvasRef, 
		audioAnalyser, 
		stream, 
		source, 
		updateAudioAnaylserRef, 
		updateAudioAnaylserDataRef,
		dataArrayRef,
		setIsMonitoring, 
		maxValRef, 
		maxIndexRef, 
		frequencyValueRef, 
		frequencyIndexRef, 
		setNoiseGate, 
		snakePositionRef, 
		oscRef, 
		oscGainRef
	} = startAudioData;
	// console.log(startAudioData);
	
	const {selectedMic, selectedFftSize, testFreq} = liveSettingUtils.current


	if (!audioCtx.current) { // Create audio context if it doesn't exist
		audioCtx.current = new AudioContext();
		console.log('created audio context');
	}
	if (audioCtx.current.state === 'suspended') { // Resume audio context if it's suspended (required in some browsers)
		await audioCtx.current.resume();
	}
	// In startAudio, change the getUserMedia call to:
	const constraints = { 
		audio: selectedMic ? { deviceId: { exact: selectedMic } } : true 
	};
	
	stream.current = await navigator.mediaDevices.getUserMedia(constraints)
		.catch(err => console.log('Error accessing microphone:', err));
	// if (audioCtx.current && stream.current) {
			// console.log(stream.current);
	source.current = await audioCtx.current.createMediaStreamSource(stream.current);
	audioAnalyser.current = audioCtx.current.createAnalyser();
	audioAnalyser.current.fftSize = selectedFftSize; // Higher fftSize gives better frequency resolution but more CPU usage
	// audioAnalyser.current.smoothingTimeConstant = 0.8; // Smoothing for more stable visualization
	source.current.connect(audioAnalyser.current);
	// }

	dataArrayRef.current = new Uint8Array(audioAnalyser.current.frequencyBinCount);

	let testnum = 0;
	updateAudioAnaylserDataRef.current = {testnum, ...startAudioData, canvasRef, audioAnalyser, dataArrayRef}
	const updateAudioAnaylserData = updateAudioAnaylserDataRef.current;
		// if(!isMonitoring) {
		// 	cancelAnimationFrame(updateAudioAnaylserRef.current);
		// } else {
		// 	updateAudioAnaylserRef.current = updateAudioAnaylser(updateAudioAnaylserData)
		// }
	
	// Setup Oscillator for testing
	// oscRef.current = audioCtx.current.createOscillator();
	// oscGainRef.current = audioCtx.current.createGain();

	// oscRef.current.type = 'square';
	// oscRef.current.frequency.setValueAtTime(testFreq, audioCtx.current.currentTime);
	// oscGainRef.current.gain.setValueAtTime(0, audioCtx.current.currentTime); // Start muted

	// oscRef.current.connect(oscGainRef.current);
	// oscGainRef.current.connect(audioCtx.current.destination);
	// oscRef.current.start();

	if (liveSettingUtils.current.isMonitoring) { // Stop monitoring if already active
		setIsMonitoring(false);
		cancelAnimationFrame(updateAudioAnaylserRef.current);
		// stream.current.getTracks().forEach(track => track.stop());
		return;
	}
	if (!liveSettingUtils.current.isMonitoring) { // Start monitoring if not already active
		setIsMonitoring(true);
		// console.log("updateAudioAnaylserData: ", updateAudioAnaylserDataRef.current);
		updateAudioAnaylserRef.current = updateAudioAnaylser(updateAudioAnaylserData);
	}
};

const updateAudioAnaylser = async (updateAudioAnaylserData) => {
	// console.log("updateAudioAnaylser");
	const {
			liveSettingUtils, audioAnalyser, 
			canvasRef,
			updateAudioAnaylserRef, 
			dataArrayRef,
			testnum,
			//  maxValRef, maxIndexRef, frequency, frequencyValueRef, frequencyIndexRef, 
			// maxValPerSec, maxValIndexPerSec, snakePositionRef
	} = updateAudioAnaylserData;
	const canvas = canvasRef.current;
	const canvasCtx = canvas.getContext('2d');
	const dataArray = dataArrayRef.current;
	

	// const {canvasType} = liveSettingUtils.current
	// console.log(liveSettingUtils);
	// console.log(canvas);

	// console.log(snakePositionRef);
	
	// audioAnalyser.current.getByteTimeDomainData(dataArray);
	audioAnalyser.current.getByteFrequencyData(dataArray);
	// console.log(dataArrayRef.current);
	

	const renderSelectedCanvasData = {
		...updateAudioAnaylserData, canvas, canvasCtx
	};

	
	canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before each redraw
	
	// canvasCtx.beginPath()
	// canvasCtx.lineTo(10,10)
	// canvasCtx.lineTo(50,80)
	// canvasCtx.lineTo(20,40)
	// canvasCtx.lineTo(10,10)
	// canvasCtx.stroke()
	// let highestVal = 0;
	// // console.log("dataArray: ", dataArray);
	// dataArray.forEach(element => {
	// 	if (element > highestVal) {
	// 		highestVal = element;
	// 	}
	
	// });
	// 	console.log(highestVal);
	// if (updateAudioAnaylserData) {
		renderSelectedCanvas(renderSelectedCanvasData);
		
	// console.log("repeating");
		
	// }

	updateAudioAnaylserRef.current = requestAnimationFrame(() => updateAudioAnaylser(updateAudioAnaylserData));
}

const renderSelectedCanvas = (renderSelectedCanvasData) => {
	// console.log("renderSelectedCanvas");
	// console.log("ncie"+'1');
	
	switch (renderSelectedCanvasData.liveSettingUtils.current.canvasType) {
		case 'Static':
			canvasStatic(renderSelectedCanvasData);
			break;
		case 'Snake':
			console.log("dj Snake");
			
			canvasSnake(renderSelectedCanvasData);
			break;
		case 'Test':
			canvasTest(renderSelectedCanvasData);
			break;
		default:
			canvasTest(renderSelectedCanvasData);
	}
}

// Convas Static
const canvasStatic = ({
		canvas, canvasCtx, audioAnalyser, dataArray, maxValRef, maxIndexRef, 
		frequencyValueRef, frequencyIndexRef, maxValPerSec, maxValIndexPerSec, 
		frequency, noiseGate
	}) => {

	// pitch detection
	canvasCtx.beginPath();
	canvasCtx.moveTo(0, canvas.height/2);
	updateStatic(canvas, canvasCtx, dataArray, maxValRef, maxIndexRef, frequencyValueRef, frequencyIndexRef, maxValPerSec, maxValIndexPerSec);
	canvasCtx.lineWidth = 1.3;
	canvasCtx.strokeStyle = 'yellowgreen';
	canvasCtx.stroke();

	// display frequency
	const { frequencyN, frequencyX, displayNote } = musicalFrequency(frequency, frequencyValueRef, frequencyIndexRef, audioAnalyser, canvas, dataArray);
	// console.log(frequencyN, frequencyX, displayNote);
	

	canvasCtx.beginPath();
	canvasCtx.font = "30px Arial";
	canvasCtx.lineTo(frequencyX, 0);
	canvasCtx.lineTo(frequencyX, canvas.height);
	canvasCtx.lineWidth = 1.3;
	
	if (frequencyValueRef.current>noiseGate) {
		canvasCtx.strokeStyle = 'cyan';
		canvasCtx.fillStyle = 'cyan';
	} else {
		canvasCtx.strokeStyle = 'tomato';
		canvasCtx.fillStyle = 'tomato';
	}
		canvasCtx.fillText(frequencyN.toFixed(2), 10, canvas.height - 40);
		canvasCtx.fillText(displayNote, 10, canvas.height - 10);
	canvasCtx.stroke();

}
const updateStatic = (canvas, canvasCtx, dataArray, maxValRef, maxIndexRef, 
	frequencyValueRef, frequencyIndexRef, maxValPerSec, maxIndexPerSec
) => {
	for (let index = 0; index < dataArray.length; index++) {
		if (dataArray[index] > maxValRef.current) {
			maxValRef.current = dataArray[index];
			maxIndexRef.current = index;
		}
		const x = canvas.width/dataArray.length * index;
		const y =canvas.height/2 - canvas.height/2 * dataArray[index]/255;
		
		canvasCtx.lineTo(x, y);

		if (dataArray[index] > maxValPerSec) {
		
			maxValPerSec = dataArray[index];
			frequencyValueRef.current = dataArray[index];
			frequencyIndexRef.current = index;
		
		}
	}
}

const musicalFrequency = (frequency, frequencyValueRef, frequencyIndexRef, audioAnalyser, canvas, dataArray) => {
	const frequencyN = frequencyValueRef.current * audioAnalyser.current.context.sampleRate / audioAnalyser.current.fftSize;
	const frequencyX = canvas.width / dataArray.length * frequencyIndexRef.current;

	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const noteIndex = Math.round(12 * Math.log2(frequencyN / 440)) + 69; // A4 is the reference note (index 69)
	const noteName = noteNames[noteIndex % 12];
	const octave = Math.floor(noteIndex / 12) - 1; // Octave calculation (A4 is in octave 4)
	const displayNote = `${noteName}${octave}`;
	console.log(noteIndex);
	
	
	return { frequencyN, frequency, frequencyX, octave, noteName, displayNote };
}

// Canvas Snake
const canvasSnake = async(test) => {
// const canvasSnake = async({
// 		liveSettingUtils, canvas, canvasCtx, audioAnalyser, dataArray, maxValRef, maxIndexRef, 
// 		frequencyValueRef, frequencyIndexRef, maxValPerSec, maxValIndexPerSec, 
// 		frequency, snakePositionRef
// 	}) => {
	// console.log(test.snakePositionRef);
	const { liveSettingUtils, canvas, canvasCtx, audioAnalyser, dataArrayRef, snakePositionRef } = test
	// return;
	const dataArray = dataArrayRef.current
	// console.log(dataArray);
	
	const {maxNoteVal, minNoteVal, totalNote, snakeLength, noiseGate} = liveSettingUtils.current
	canvasCtx.beginPath();
	canvasCtx.strokeStyle = "green"
	
	let x = snakePositionRef.current.length; // Move 2 pixels to the right for each new point
	let y = 0;
	let maxVal = 0;
	let maxIndex = 0;

	let pianoRollWidth = 10/100*canvas.width
	let snakeWidth = 90/100*canvas.width

	for (let index = 0; index < dataArray.length; index++) {
		if (dataArray[index] > maxVal) {
			maxVal = dataArray[index];
			y = Math.max(y, index);
			maxIndex = y;
		}
	}
	const frequencyS = y * audioAnalyser.current.context.sampleRate / audioAnalyser.current.fftSize;
	// console.log(audioAnalyser.current.context.sampleRate , audioAnalyser.current.fftSize);
	// console.log(frequencyS);
	
	const noteValue = 12 * Math.log2(frequencyS / 440) + 69; // A4 is the reference note (index 69)
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const note = noteNames[Math.round(noteValue)%12]
	// y = noteValue / 136 * canvas.height; // Scale y to fit the canvas height
	y = ((noteValue-minNoteVal) / (maxNoteVal-minNoteVal)) * canvas.height; // Scale y to fit the canvas height
	y = canvas.height - y; // Invert y to have higher frequencies at the top

	if (noiseGate<maxVal) {
		snakePositionRef.current.push({ x, y }); // Add the new position to the snake's body
		// snakePositionRef.current.push({ x, y:50.5 }); // Add the new position to the snake's body
		
	} else {	
		snakePositionRef.current.push({ x, y: 0 }); // If below noise gate, move to the middle
	}
	
	if (snakePositionRef.current.length>snakeLength) {
		// snakePositionRef.current = snakePositionRef.current.shift(); // Keep only the last 100 positions
		snakePositionRef.current = snakePositionRef.current.slice(1); // Keep only the last 100 positions
	}
	for (let index = 0; index < snakePositionRef.current.length; index++) {
		const element = snakePositionRef.current[index];
		const newX = element.x/snakeLength*snakeWidth
		if (index ===0 || element.y<=0) {
			canvasCtx.moveTo(newX, element.y)
		} else if (snakePositionRef.current[index-1].y<=0) {
			canvasCtx.moveTo(newX, element.y)
		} 
		else {
			canvasCtx.lineTo(newX, element.y)
		}
		
		snakePositionRef.current[index].x = element.x - 1; // Move the snake to the left by 2 pixels for the next frame
	}

	// frequency and note renderer
	canvasCtx.font = '20px Arial';
	canvasCtx.fillStyle = 'white';
	canvasCtx.fillText(frequencyS.toFixed(2)+"Hz", 10, canvas.height - 100);
	canvasCtx.fillText("Value: "+noteValue.toFixed(2), 10, canvas.height - 70);
	canvasCtx.fillText("Round: "+Math.round(noteValue)%12, 10, canvas.height - 40);
	canvasCtx.fillText(`Note: ${note}${Math.floor(noteValue/12)-1} `, 10, canvas.height - 10);
	// console.log(`NoteValue: ${noteValue} Note: ${note}${Math.floor(noteValue/12)-1} `);
	
	canvasCtx.lineWidth = 1;
	canvasCtx.stroke();

	// piano Roll
	const noteHieght =  canvas.height / totalNote
	for (let i = 0; i < totalNote+1; i++) {
		// const yPos = canvas.height - (i / totalNote * canvas.height);
		// const yPos = canvas.height - (canvas.height+(i - 1)*noteHieght);
		const currentNote = i + minNoteVal
		const yPosRaw = (currentNote-minNoteVal) / (maxNoteVal-minNoteVal) * canvas.height
		const yPos = canvas.height - yPosRaw-noteHieght/2
		const noteName = noteNames[Math.abs(currentNote % 12)];
		const isSharp = noteName.includes('#');

		// 1. Draw the background "Key"
		canvasCtx.fillStyle = isSharp ? '#1a1a1a' : '#f3f3f3'; // Black keys darker
		canvasCtx.fillRect(canvas.width - pianoRollWidth, yPos, pianoRollWidth, noteHieght);

		// 2. Only draw text for 'C' notes to keep it clean, or all notes if zoomed
		if (noteName === 'C') {
			canvasCtx.fillStyle = 'black';
			canvasCtx.font = '10px Arial';
			canvasCtx.fillText(`${noteName}${Math.floor(currentNote/12)-1}`, canvas.width - pianoRollWidth+1/100*canvas.width, yPos + 10);
		}
		if (noteName === 'D'||noteName === 'E'||noteName === 'F'||noteName === 'G'||noteName === 'A'||noteName === 'B') {
			canvasCtx.fillStyle = 'black';
			canvasCtx.font = '10px Arial';
			canvasCtx.fillText(`${noteName}`, canvas.width - pianoRollWidth+1/100*canvas.width, yPos + 10);
		}
		if (isSharp) {
			canvasCtx.fillStyle = 'white';
			canvasCtx.fillText(`${noteName}`, canvas.width - pianoRollWidth+1/100*canvas.width, yPos + 10);
		}
		
		// 3. Draw a very faint horizontal line across the WHOLE canvas for the grid
		canvasCtx.strokeStyle = '#333';
		canvasCtx.lineWidth = 0.5;
		canvasCtx.beginPath();
		canvasCtx.moveTo(0, yPos);
		canvasCtx.lineTo(canvas.width, yPos);
		canvasCtx.stroke();
	}

	// canvasCtx.strokeRect(canvas.width-100,0,100,canvas.height/136)
}

// Canvas Test
const canvasTest = async(canvasTestData) => {
	const {canvas, canvasCtx, audioAnalyser, dataArrayRef, maxValRef, maxIndexRef, 
		frequencyValueRef, frequencyIndexRef, maxValPerSec, maxValIndexPerSec, 
		frequency, noiseGate, snakePositionRef} = canvasTestData
// const canvasTest = async({
// 	canvas, canvasCtx, audioAnalyser, dataArray, maxValRef, maxIndexRef, 
// 	frequencyValueRef, frequencyIndexRef, maxValPerSec, maxValIndexPerSec, 
// 	frequency, noiseGate, snakePositionRef
// }) => {
	// canvasCtx.beginPath();
	// canvasCtx.moveTo(20, 30);
	// canvasCtx.lineTo(canvas.width-10, canvas.height-10);
	// canvasCtx.moveTo(canvas.width-100, 70);
	// canvasCtx.lineTo(80, canvas.height-50);
	// canvasCtx.strokeStyle = 'cyan';
	// canvasCtx.lineWidth = 1.3;
	// canvasCtx.stroke();

	// console.log(canvasTestData);
	canvasCtx.moveTo(20, 30);
	for (let i = 0; i < i/1024*canvas.height; i++) {
		const element = dataArrayRef.current[i];	
		let y =canvas.height/dataArrayRef.current.length * i;
		
		for (let j = 0; j < j/1024*canvas.height; j++) {
			const element = dataArrayRef.current[j];
			const x = canvas.width/dataArrayRef.current.length * j;
			
			canvasCtx.fillStyle = 'black';
			canvasCtx.font = '10px Arial';
			canvasCtx.fillText(`${element}`, x, y)
			console.log(y+"aSDa");
			
			
			
		}
	}
	
}	

// const log = (...log) => {	
// 	console.log(...log);
// }
