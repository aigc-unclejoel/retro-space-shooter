# Retro Space Shooter

## About This Game

**Retro Space Shooter** is a retro arcade-style space shooter inspired by classic vector games like *Asteroids*.

The game uses a black starfield and white line-art graphics. You fly a triangular ship, shoot rocks, dodge hunter UFOs and red clusters, collect pickups, and fight a boss on every 5th wave. You start with 3 lives. The top 5 scores stay saved in the browser.

This project was built with AI assistance using [Cursor](https://cursor.com).

---

## Game Controls

### Desktop

| Key / Input | Action |
|-------------|--------|
| **W** | Thrust forward |
| **A** | Rotate left |
| **D** | Rotate right |
| **S** | Reverse thrust / slow down |
| **Spacebar** | Shoot. On key press, also fires one stored bomb if you have one |
| **E** | Shockwave |
| **Mouse over canvas** | Ship rotates toward the cursor; distance from the ship controls thrust |
| **Left click (hold)** | Fire |
| **Right click** | Shockwave |

On the title screen, **Space** starts the game. On the game over screen, **Space** returns to the title.

**FULL SCREEN** sits just to the left of **SFX ON / OFF** at the bottom-right. Tap or click **FULL SCREEN** to ask the browser to go full screen. The label changes to **EXIT FULL**. Tap or click that to leave full screen. The game does not enter full screen by itself.

### Mobile

The playfield fills the phone in landscape. If the phone is held upright, the game turns sideways. The joystick and action buttons float on the playfield. There is no separate control panel.

- **Joystick** — drag toward where you want to fly; pull opposite your drift to slow down. Steering starts only when the thumb touches the circle. If the thumb slides outside the circle but stays on the screen, the ship keeps following it. Lifting the thumb stops steering. Touching down again outside the circle does not steer
- **FIRE** — shoot. Hold to keep firing
- **BOMB** — fire one stored bomb. The label stays **BOMB**. Extra charges are shown in the pickup list at the top-right, not on the button
- **WAVE** — shockwave. The button stays faint during the cooldown, including the countdown number, and turns bright when it is ready
- About a second after a wave begins, the joystick and **FIRE** fade to a faint outline so rocks and the ship can be seen through them. A control that you keep holding fades again after a brief moment
- **Tap** the title screen to start; **tap** the game over screen to return to the title

The game over title, score, and high scores are centered on the screen. **Tap screen to return to title** sits directly under that block.

**FULL SCREEN** and **SFX ON / OFF** sit together at the bottom center. They work the same way as on desktop.

### Debug keys (desktop)

These are for testing. They do nothing on the title screen or during game over, except **1**, which can start a boss test from the title.

| Key | Action |
|-----|--------|
| **U** | Force-spawn a UFO |
| **B** | Add one bomb charge (does not fire it) |
| **1** | Enter the wave 5 boss test in debug mode. The ship can still break, but it does not lose a life. Press **1** again to leave debug mode |

---

## Gameplay Features

- **Full-window playfield** — desktop fills the browser window. The game stays 540 units tall, and the width follows the screen, so objects keep their size on a widescreen monitor. On a phone the playfield also fills the screen, with the controls drawn on top of it
- **Drifting starfield** — two layers of slow white dots. A star hides while it is inside a rock, UFO, cluster circle, boss circle, or the ship
- **Inertia** — the ship drifts and does not stop instantly
- **3 lives** — shown as small ships under the score, including on a phone. A hit breaks the ship into debris, then a new ship appears. Respawns avoid the center if something is already there. A thumb already resting on the joystick when the new ship appears can steer it immediately
- **Shooting** — Space or FIRE. Hold **FIRE** to keep shooting. Bullets wrap the screen until they expire
- **Rocks** — large rocks split into medium, medium into small. Rocks bounce off each other and are pushed out of UFOs, clusters, and the boss
- **Waves** — clearing the field starts the next wave. A title card (**WAVE N**) fades in above the ship before enemies appear. Clearing a wave scores a bonus, plus a clean bonus if the shockwave was not used
- **Red clusters** — some large rocks hide a cluster of small red circles. The cluster turns slowly. A ripple travels around the circles so they briefly shrink and grow back, like living cells. Bullets peel the outer ring. The ship touching one costs a life. Destroying the last circle clears the cluster
- **UFO hunter** — a green saucer that does not shoot. It patrols, chases when you are close, and steers around rocks and clusters. Contact costs a life unless a shield is up. From wave 5, up to two UFOs can be on screen. UFOs are worth 500 points
- **Boss** — wave 5 and every 5th wave is **CRIMSON NUCLEUS**, a spinning red core with five outer shells. Its circles use the same living ripple as the clusters. It chases slowly. Peel circles one at a time; the boss dies only when every core circle is gone. Under half core it stops, pulses five red rings, then regrows missing shell circles from the inside out. Later rebuilds wait until the outer shell is under half. After a boss, later waves add extra rocks and a little more rock speed
- **Shockwave** — **E** or **WAVE**, with a 5-second cooldown. The label at the top-right reads **SHOCKWAVE READY**. The ring breaks rocks, destroys UFOs, and pops cluster and boss circles it touches. Firing it also slows the ship along the direction it is facing. Rocks and the shockwave keep moving while the ship is breaking. Pieces from a broken rock are pushed clear of the ship so they do not appear on top of it
- **Pickups** — blue icons that drift until collected. At most 10 of each type can be on screen. Each one lasts 30 seconds, then blinks and fades over the last 8 seconds. Effects stay active together until their own timers end
- **Score and high scores** — score at the top-left, wave at the top-center, active pickups in blue under the shockwave label. The top 5 scores are saved in `localStorage`, each with the wave from that game over. On the game over screen they form a centered grid of rank, score, and wave. A `*` sits just to the right of the latest record
- **Delta time** — movement and timers follow real time, so a 30 fps device and a 144 Hz monitor play at the same speed until a frame takes longer than 50 ms
- **Sound** — Web Audio only (no audio files): lasers, explosions, thrust, shockwave, UFO hums, cluster pops, and bomb sounds. The UFO hum stops when the UFO leaves or is destroyed, and when the tab is hidden

### Pickups

| Pickup | Icon | Effect |
|--------|------|--------|
| **Rapid** | Blue diamond with **R** | 8 seconds of faster fire. Another rapid pickup adds 8 seconds |
| **Triple** | Blue diamond with **3** | 8 seconds of three bullets per shot (one ahead, two angled out). Another triple pickup adds 8 seconds. With rapid fire, the three-bullet shot fires faster |
| **Slow** | Blue circle with a dash | 8 seconds of slower ship speed. Another slow pickup sets the timer back to 8 seconds |
| **Shield** | Blue circle with a plus | One charge. Touching a hazard pops the circles the shield touches, then the shield breaks, and you do not lose a life |
| **Bomb** | Blue triangle with **B** | Adds one stored charge (they stack). It does not fire on pickup. Space or **BOMB** launches one blue triangle that wiggles, wraps the screen, and explodes on impact or after a set distance. The blue blast destroys rocks, UFOs, and whole clusters, and pops boss circles near the impact. The ship is shoved if the ring touches it |

Letters on pickups spin with the icon.

---

## Version History

### Version 1.0

- Created the first playable version
- Added spaceship movement with inertia and drifting
- Added shooting, rock spawning, rock splitting, and rock-to-rock bounce
- Added explosions, smoke, score, high scores, and the title / game over flow
- Added retro sound effects

### Version 2.0

- Added desktop and mobile layouts, joystick steering, and the shockwave
- Added mouse aim, thrust-by-distance, click-to-fire, and right-click shockwave
- Added delta-time updates so speed stays consistent across frame rates

### Version 2.1

- Added the UFO hunter, its sounds, and the **U** debug spawn

### Version 3.0

- Added 3 lives, ship debris, and safer respawns
- Made the desktop playfield fill the window without stretching objects
- Added the drifting starfield, red clusters, pickups, and the cluster bomb
- Added wave title cards and the Crimson Nucleus boss on every 5th wave
- Added the triple-shot pickup and the pickup limit, timer, and fade
- Added debug keys **B** and **1**

### Version 3.1

- Marked the bomb pickup with a blue **B** that spins with the triangle, the same way **R** and **3** spin
- Pickups now disappear after 30 seconds, blinking and fading over the last 8 seconds

### Version 3.2

- The fired bomb is a blue triangle, matching the pickup
- High scores save the wave reached and show rank, score, and wave in a centered grid, with `*` beside the latest record
- The playfield keeps moving during a ship break, and rock pieces from a shockwave are pushed clear of the ship

### Version 3.3

- Phone play fills the screen in landscape, with the joystick, **FIRE**, **WAVE**, and **BOMB** floating on the playfield
- **BOMB** stays labeled **BOMB**. The stored count remains in the top-right list
- **FULL SCREEN** / **EXIT FULL** sits beside the sound toggle on phones and on PC. Full screen starts only when that button is used
- Red clusters turn slowly, and red circles pulse like living cells. The boss uses the same pulse
- A held **FIRE** button keeps shooting. Controls fade while they are held so they do not cover the action

---

## How To Run The Game

### Option 1: Open directly in a browser

1. Download or clone this project
2. Open `index.html` in a current browser (Chrome, Firefox, Edge, or Safari)

No install or build step is required.

### Option 2: Run a local server

If you have Node.js installed:

```bash
cd "Retro Asteroids Game"
npx serve . -l tcp://0.0.0.0:8080
```

Then open [http://localhost:8080](http://localhost:8080).

If you have Python installed:

```bash
cd "Retro Asteroids Game"
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

> **Note:** Error `-102` / connection refused usually means the local server is not running. Start the server and keep the terminal open while you play.

### Option 3: GitHub Pages

1. Push this project to a GitHub repository
2. Go to **Settings → Pages**
3. Set the source branch (usually `main`) and folder (`/root`)
4. Save and wait for GitHub Pages to deploy
5. Open the published URL

---

## Project Structure

```
Retro Asteroids Game/
├── index.html      # Page, canvas, and on-screen controls
├── style.css       # Layout for desktop and mobile
├── game.js         # Game loop, enemies, pickups, boss, and audio
├── manifest.json   # Phone home-screen name, landscape, and full screen
└── README.md       # This file
```

---

## Future Ideas

- More boss types
- Online high-score leaderboard
- More enemy types

---

## License

This is a beginner-friendly learning project. Feel free to use, modify, and share it.
