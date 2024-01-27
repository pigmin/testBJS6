let sixDofJoint = new BABYLON.Physics6DoFConstraint(
    {
        pivotA: new BABYLON.Vector3(0, 0, 0),
        pivotB: new BABYLON.Vector3(0, 0, 0),
        perpAxisA: new BABYLON.Vector3(0, 0, 0),
        perpAxisB: new BABYLON.Vector3(0, 0, 0),
    },
    [
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
            minLimit: 0,
            maxLimit: 0,
        },
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
            minLimit: 0,
            maxLimit: 0,
        },
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
            minLimit: 0,
            maxLimit: 0,
        },
    ],
    scene
);