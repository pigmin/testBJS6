import { Matrix, Mesh, MeshBuilder, Physics6DoFConstraint, PhysicsAggregate, PhysicsConstraintAxis, PhysicsMotionType, PhysicsShapeType, Quaternion, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

import girlModelUrl from "../assets/models/girl1.glb";

const RUNNING_SPEED = 8;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;

class Player {

    scene;
    //Position dans le monde
    transform;
    //Mesh
    gameObject;
    //Physic
    capsuleAggregate;
        
    //Animations
    animationsGroup;
    
    bWalking = false;
    bOnGround = false;
    bFalling = false;
    bJumping = false;

    idleAnim;
    runAnim;
    walkAnim;

    x = 0.0;
    y = 0.0;
    z = 0.0;

    speedX = 0.0;
    speedY = 0.0;
    speedZ = 0.0;

    constructor(x, y, z, scene) {

        this.scene = scene;
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.transform = new MeshBuilder.CreateCapsule("player", {height: PLAYER_HEIGHT, radius: 0.4}, this.scene);
        this.transform.visibility = 0.0;
        this.transform.position = new Vector3(this.x, this.y, this.z);

    }

    async init() {
        //On cré le mesh et on l'attache à notre parent
        const result = await SceneLoader.ImportMeshAsync("", "", girlModelUrl, this.scene);
        this.gameObject = result.meshes[0];
        this.gameObject.scaling = new Vector3(1, 1, 1);
        this.gameObject.position = new Vector3(0, -PLAYER_HEIGHT/2, 0);
        this.gameObject.rotate(Vector3.UpReadOnly, Math.PI);
        this.gameObject.bakeCurrentTransformIntoVertices();
        this.gameObject.checkCollisions = true;
        
        this.capsuleAggregate = new PhysicsAggregate(this.transform, PhysicsShapeType.CAPSULE, { mass: 1, restitution:0}, this.scene);
        this.capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        //On bloque les rotations avec cette méthode, à vérifier.
        this.capsuleAggregate.body.setMassProperties({
           inertia: new Vector3(0, 0, 0),
        });


        this.gameObject.parent = this.transform;
        this.animationsGroup = result.animationGroups;
        this.animationsGroup[0].stop();
        this.idleAnim = this.scene.getAnimationGroupByName('Idle');
        this.runAnim = this.scene.getAnimationGroupByName('Running');
        this.walkAnim = this.scene.getAnimationGroupByName('Walking');
        this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
    }

    //Pour le moment on passe les events clavier ici, on utilisera un InputManager plus tard
    update(inputMap, actions, delta) {
        //Inputs
        if (inputMap["KeyA"])
            this.speedX = -RUNNING_SPEED;
        else if (inputMap["KeyD"])
            this.speedX = RUNNING_SPEED;
        else {
            //Frottements
            this.speedX += (-10.0 * this.speedX * delta);
        }

        if (inputMap["KeyW"])
            this.speedZ = RUNNING_SPEED;
        else if (inputMap["KeyS"])
            this.speedZ = -RUNNING_SPEED;
        else {
            //Frottements
            this.speedZ += (-10.0 * this.speedZ * delta);
        }

        if (actions["Space"]) {
            //Pas de delta ici, c'est une impulsion non dépendante du temps (pas d'ajout)
            //On autorise le saut meme si on es pas vraiment sur le sol (presque) a condition d'etre en train de tomber
            if (this.y <= 2.0 && this.speedY < 0)
                this.speedY = 50;
        }

        //Gravity 
        let currentVelocity = this.capsuleAggregate.body.getLinearVelocity();
        currentVelocity = new Vector3(this.speedX, currentVelocity.y, this.speedZ);

        //Position update
        this.capsuleAggregate.body.setLinearVelocity(currentVelocity);

        //Orientation
        let directionXZ = new Vector3(this.speedX, 0, this.speedZ);


        //Animations
        if (directionXZ.length() > 2.5) {
            /* Autre tentative de  rotation autour de l'axe Z uniquement
                const lookAt = Matrix.LookAtLH(
                Vector3.Zero,
                directionXZ,
                Vector3.UpReadOnly
            ).invert();
            this.gameObject.rotationQuaternion = Quaternion.FromRotationMatrix( lookAt );*/

            this.gameObject.lookAt(directionXZ.normalize());
            
            if (!this.bWalking) {
                this.runAnim.start(true, 1.0, this.runAnim.from, this.runAnim.to, false);
                this.bWalking = true;
            }
        }
        else {
            if (this.bWalking) {
                this.runAnim.stop();
                this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
                this.bWalking = false;
            }
        }
    }

}

export default Player;