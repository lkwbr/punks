const GAME_WIDTH = 480
const GAME_HEIGHT = 270

const IMG_WIDTH = 8 * 10
const IMG_HEIGHT = 15 * 10

const NUM_FRAMES = 2 
const RENDER_MS = 500
const BG_COLORS = ['#BB2528', '#165B33']
const PARTICLE_CEILING = 25

const USERS = ['emilia', 'logan', 'ben', 'luke', 'josh', 'nick', 'rob', 'dee']
const DEFAULT_USER = USERS[Math.floor(Math.random() * USERS.length)]

function start() {
    // TODO parameterize
    //
    let it = 1
/*
    fetch('/res/' + name + '.txt').then(response => response.text()).then(data => {
        console.log(data)

				document.title = name

        // Set initial mug and poem
        //document.getElementById('name').innerHTML = name;
        //document.getElementById('mug').src = 'res/' + name + '_' + it + '.png';
        //document.getElementById('poem').innerHTML = data;
        // Play background music on loop 
        let music = new Audio('music.mp3')
        music.loop = true
        music.muted = true
        // Play user voice
        voice = new Audio('res/' + name + '.mp3')
        voice.loop = true
        voice.muted = true
        // voice.play()
        //music.play()

				Game.motto = data

        // Animate the mug 
				Game.init()
				//Game.resize()
    })
*/
		Game.init()
}

const Game = {
    init() {
        // Initialize canvas
        Game.canvas = document.getElementById('canvas')
        Game.ctx = Game.canvas.getContext('2d')

				Game.user = DEFAULT_USER

				Game.it = 0
				Game.mode = 'pause'

        // Load our "game grid" image
				Game.images = Array.from({ length: NUM_FRAMES }, (_, i) => new Image())
        Game.images.forEach((x, i) => x.src = `res/${Game.user}_${i + 1}.png`)

        // Request first frame
        Game.images[0].onload = () => {
						window.requestAnimationFrame(() => Game.update())
        }
		
				// Attach canvas listeners
				Game.canvas.addEventListener("mousedown", function (e) {
					Game.mode = (Game.mode === "pause") ? "run" : "pause"
				}, false);

    },

		pause() {
				// Draw the background
				Game.ctx.fillStyle = "#ffffff" 
				Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)

				const centerX = Game.canvas.width / 2
				const centerY = Game.canvas.height / 2

				// Draw the name
				Game.ctx.fillStyle = "black";
				Game.ctx.font = "100px 'VT323', monospace"
				Game.ctx.fillText("PAUSED", centerX - 110, centerY)
	  },

		draw() {
				// Draw the background
				Game.ctx.fillStyle = BG_COLORS[Game.it % BG_COLORS.length]
				Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)

				// Draw the snow
				const numSnowParticles = Math.floor(PARTICLE_CEILING * Math.random())
				Game.ctx.fillStyle = '#ffffff'
				Array.from(Array(numSnowParticles)).forEach((x, i) => {
						Game.ctx.fillRect(
								Math.floor(Math.random() * Game.canvas.width), 
								Math.floor(Math.random() * Game.canvas.height),
								10,
								10	
						)
				})

				// Draw the person
				const image = Game.images[Game.it % NUM_FRAMES]
				const centerX = Game.canvas.width / 2
				const centerY = Game.canvas.height / 2
				const imgWidth = image.width * 20
				const imgHeight = image.height * 20
				Game.ctx.drawImage(
						image,
						centerX - imgWidth / 2,
						centerY - imgHeight / 2,
						imgWidth,
						imgHeight
				)

				// Draw the name
				/*
				Game.ctx.fillStyle = "white";
				Game.ctx.font = "100px 'VT323', monospace"
				Game.ctx.fillText(name.toUpperCase(), centerX - 110, centerY - centerY / 2)
				*/

				// ...
				var msg = new SpeechSynthesisUtterance()
				msg.text = Game.motto 
				window.speechSynthesis.speak(msg)
		},

		update() {
				Game.resize()

				if (Game.mode === 'pause') {
					Game.pause()
				} else if (Game.mode === 'run') {
					Game.draw()	
				} else {
					console.log('wtf')
				}
		
				// Render next frame with a delay	
				Game.it += 1 
			  setTimeout(() => window.requestAnimationFrame(() => Game.update()), RENDER_MS);	
		},

		resize() {
				// Set the canvas width and height
				Game.canvas.width = window.innerWidth;
				Game.canvas.height = window.innerHeight;

				// Don't forget to turn off image smoothing
				Game.ctx.imageSmoothingEnabled = false;
		}
}

window.onload = start
