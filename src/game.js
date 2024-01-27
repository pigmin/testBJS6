import { ActionManager, Color3, Color4, FollowCamera, FreeCamera, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, Scene, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Inspector } from '@babylonjs/inspector';


import floorUrl from "../assets/textures/floor.png";
import floorBumpUrl from "../assets/textures/floor_bump.png";
import Player from "./player";

class Game {

    #canvas;
    #engine;
    #gameScene;
    #gameCamera;
    #bInspector = false;

    #sphere;
    #zoneA;
    #zoneB;

    #phase = 0.0;
    #vitesseY = 1.8;

    inputMap = {};
    actions = {};

    #player;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    async start() {
        await this.initGame()
        this.gameLoop();
        this.endGame();
    }

    createScene() {
        const scene = new Scene(this.#engine);
        
        this.#gameCamera = new FollowCamera("camera1", new Vector3(0, 18, -35), scene);
        this.#gameCamera.heightOffset = 18;
        this.#gameCamera.radius = -35;
        this.#gameCamera.maxCameraSpeed = 1;
        this.#gameCamera.cameraAcceleration = 0.025;
        this.#gameCamera.rotationOffset = 0;
        //this.#gameCamera.setTarget(Vector3.Zero());
        this.#gameCamera.attachControl(this.#canvas, true);

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        const sLight = new SpotLight("spot1", new Vector3(0, 20, 20), new Vector3(0, -1, -1), 1.2, 24, scene);
        const shadowGenerator = new ShadowGenerator(1024, sLight);
        shadowGenerator.useBlurExponentialShadowMap = true;

        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
        sphere.position.y = 5;
        this.#sphere = sphere;

        const ground = MeshBuilder.CreateGround("ground", { width: 64, height: 64 }, scene);

        const matGround = new StandardMaterial("boue", scene);
        //matGround.diffuseColor = new Color3(1, 0.4, 0);
        matGround.diffuseTexture = new Texture(floorUrl);
        matGround.bumpTexture = new Texture(floorBumpUrl);

        ground.material = matGround;
        ground.receiveShadows = true;

        const matSphere = new StandardMaterial("silver", scene);
        matSphere.diffuseColor = new Color3(0.8, 0.8, 1);
        matSphere.specularColor = new Color3(0.4, 0.4, 1);
        sphere.material = matSphere;

        shadowGenerator.addShadowCaster(sphere);

        sphere.actionManager = new ActionManager(scene);
        sphere.actionManager.registerAction(
            new InterpolateValueAction(
                ActionManager.OnPickTrigger,
                light,
                'diffuse',
                Color3.Black(),
                1000
            )
        );


        this.#zoneA = MeshBuilder.CreateBox("zoneA", { width: 8, height: 0.2, depth: 8 }, scene);
        let zoneMat = new StandardMaterial("zoneA", scene);
        zoneMat.diffuseColor = Color3.Red();
        zoneMat.alpha = 0.5;
        this.#zoneA.material = zoneMat;
        this.#zoneA.position = new Vector3(12, 0.1, 12);


        this.#zoneB = MeshBuilder.CreateBox("zoneB", { width: 8, height: 0.2, depth: 8 }, scene);
        let zoneMatB = new StandardMaterial("zoneB", scene);
        zoneMatB.diffuseColor = Color3.Green();
        zoneMatB.alpha = 0.5;
        this.#zoneB.material = zoneMatB;
        this.#zoneB.position = new Vector3(-12, 0.1, -12);

        sphere.actionManager.registerAction(
            new SetValueAction(
                { trigger: ActionManager.OnIntersectionEnterTrigger, parameter: this.#zoneB },
                sphere.material,
                'diffuseColor',
                Color3.Green()
            )
        );

        sphere.actionManager.registerAction(
            new SetValueAction(
                { trigger: ActionManager.OnIntersectionExitTrigger, parameter: this.#zoneB },
                sphere.material,
                'diffuseColor',
                sphere.material.diffuseColor
            )
        );

        return scene;
    }

    async initGame() {
        this.#gameScene = this.createScene();
        this.#player = new Player(3, 10, 3, this.#gameScene);
        await this.#player.init();
        this.#gameCamera.lockedTarget = this.#player.transform;

        this.initInput();
    }

    initInput() {
        this.#gameScene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.inputMap[kbInfo.event.code] = true;
                    console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.inputMap[kbInfo.event.code] = false;
                    this.actions[kbInfo.event.code] = true;
                    console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
            }
        });
    }

    endGame() {

    }

    gameLoop() {

        const divFps = document.getElementById("fps");
        this.#engine.runRenderLoop(() => {

            this.updateGame();


            //Debug
            if (this.actions["KeyI"]) {
                this.#bInspector = !this.#bInspector;

                if (this.#bInspector)
                    Inspector.Show();
                else
                    Inspector.Hide();
            }

            this.actions = {};
            divFps.innerHTML = this.#engine.getFps().toFixed() + " fps";
            this.#gameScene.render();
        });
    }

    updateGame() {

        let delta = this.#engine.getDeltaTime() / 1000.0;

        this.#player.update(this.inputMap, this.actions, delta);

        //Animation
        this.#phase += this.#vitesseY * delta;
        this.#sphere.position.y = 2 + Math.sin(this.#phase);
        this.#sphere.scaling.y = 1 + 0.125 * Math.sin(this.#phase);

        //Collisions
        if (this.#sphere.intersectsMesh(this.#zoneA, false))
            this.#sphere.material.emissiveColor = Color3.Red();
        else
            this.#sphere.material.emissiveColor = Color3.Black();

    }
}

export default Game;