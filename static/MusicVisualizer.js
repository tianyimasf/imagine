let canvas = document.getElementById('MusicVisualizerCanvas');
let context = canvas.getContext('2d');
let audio = document.getElementById('song')
let spectgram = []
let wave_amp = []
let ymax = 0
let stride_size = 0
let x_interval = 0
let window_ms = 50
let sr = 0
let song_url = audio.src
song_url = song_url.split('0/')[1]

window.onload = function(){
	init(context);
	window.addEventListener("resize", init, false);
	context.fillStyle = 'black';
	let x = context.canvas.width
	let y = Math.floor(context.canvas.height * 0.2)
	context.beginPath();
	context.moveTo(0, y);
	context.lineTo(x, y);
	context.stroke();
}

function init(context){
	let width = window.innerWidth
	let height = window.innerHeight
	context.canvas.width = width;
	context.canvas.height = height;
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');
console.log(csrftoken)

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

let canPlay = false
let canPlay_buff = false
let duration = 10
let audio_duration = audio.duration

audio.addEventListener('canplaythrough', function(){
	console.log(audio_duration)
	if (audio_duration != Infinity){
		for (let i = 0; i < audio_duration; i+=duration){
			processSong(i, Math.min(audio_duration - i, duration))
		}
	} else {
		console.log(audio_duration)
	}
}, false);

audio.addEventListener('play', function(){
	if (!canPlay){
		audio.pause()
	} else {
		myInterval = setInterval(visualizeMusic, window_ms);
	}
});

let interval = 1

function visualizeMusic(){
	if (!audio.paused){
		time_idx = Math.floor(audio.currentTime / (0.001* window_ms / 2)) 
		paintFreq(time_idx)
		paintAmp(time_idx)
		context.clearRect(0, 0, canvas.width, canvas.height);
	} else {
		clearInterval(myInterval)
	}
}

function paintFreq(time_idx){
	//console.log(time_idx)
	let freq = spectgram[time_idx]
	let bins_num = Math.floor(800/(sr/2/freq.length))
	let width = context.canvas.width
	let height = context.canvas.height
	let bin_len = width / bins_num
	console.log(freq.length, bin_len)
	let scale = 500 / Math.max.apply(Math, freq);
	for (let x = 0; x < bins_num; x++){
		//console.log('paintFreq')
		let amp = Math.floor(freq[x] * scale)
		context.fillStyle = 'black';
		console.log(scale, Math.max.apply(Math, freq), freq[x], height - amp)
		context.fillRect(x * bin_len, height - amp, bin_len, height);
	}
}

let seg = 500 / (window_ms / 2)
let paint_seg = Math.floor(context.canvas.width / (seg + 2*2))

function paintAmp(time_idx){
	//console.log(time_idx)
	if (time_idx >= seg - 1){
		let x = paint_seg * 2
		let y = Math.floor(context.canvas.height * 0.2)
		paintEdge(0, x)
		scale = 25 / ymax
		context.fillStyle = 'black';
		context.beginPath();
		context.moveTo(x, y);
		console.log('paintAmp3')
		for (let time_idx_seg = time_idx - seg; time_idx_seg <= seg; time_idx_seg++){
			console.log('paintAmp1')
			for (let amp in wave_amp[time_idx_seg]){
				console.log('paintAmp2')
				y = y - amp * scale
				context.lineTo(x + x_interval,  y);
				x += x_interval
			}
		}
		context.stroke();
		paintEdge(x, context.canvas.width)
	} else {
		console.log('paintAmp3')
		let x = paint_seg * (1 + seg - time_idx)
		let y = Math.floor(context.canvas.height * 0.2)
		paintEdge(0, x)
		scale = 50 / ymax
		context.fillStyle = 'black';
		context.beginPath();
		context.moveTo(x, y);
		for (let time_idx_seg = 0; time_idx_seg <= time_idx; time_idx_seg++){
			console.log('paintAmp1')
			for (let amp in wave_amp[time_idx_seg]){
				console.log('paintAmp2')
				y = Math.floor(y - amp * scale)
				context.lineTo(x + x_interval, y);
				x += x_interval
			}
		}
		context.stroke();
		paintEdge(x, context.canvas.width)
	}
}

function paintEdge(x1, x2){
	context.fillStyle = 'black';
	let y = Math.floor(context.canvas.height * 0.2)
	context.beginPath();
	context.moveTo(x1, y);
	context.lineTo(x2, y);
	context.stroke();
}

function processSong(startSec, duration){
	console.log(startSec)
	$.ajax({
		type: "POST",
		url: "processed",
		data: { csrfmiddlewaretoken: csrftoken, song_url: song_url, window_ms: window_ms, startSec: startSec, duration: duration},
		success: storeData,
		error: function(xhr, status, error){
			var errorMessage = xhr.status + ': ' + xhr.statusText
			console.log('Error - ' + errorMessage)
		}
});
}

function storeData(response){
	spectgram_res = response['spectgram']
	wave_amp_res = response['wave_amp']
	for (var i in response['spectgram']){
		//console.log(spectgram_res[i])
		spectgram.push(spectgram_res[i])
	}
	for (var i in response['wave_amp']){
		wave_amp.push(wave_amp_res[i])
	}
	ymax = parseFloat(response['ymax'])
	stride_size = spectgram[0].length
	canPlay_buff = response['canPlay']
	sr = parseInt(sr)
	console.log(canPlay)
	if (canPlay_buff){
		canPlay = canPlay_buff
		x_interval = paint_seg / stride_size
		alert('You can play the music now!')
	}
	//console.log(spectgram)
	//console.log(wave_amp)
}


