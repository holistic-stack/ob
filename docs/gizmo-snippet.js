var _createScene = () => {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.ArcRotateCamera('Camera', 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, false);
  camera.setPosition(new BABYLON.Vector3(0, 5, -10));

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'sphere' shape.
  var sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene);

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1;

  // Our built-in 'ground' shape.
  var _ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene);

  if (window.gizmo) {
    document.body.removeChild(window.gizmo);
  }
  const gizmo = new OrientationGizmo(camera);
  gizmo.style.position = 'absolute';
  gizmo.style.top = '10%';
  gizmo.style.left = '90%';
  document.body.appendChild(gizmo);
  window.gizmo = gizmo;

  scene.registerBeforeRender(() => {
    gizmo.update();
  });
  return scene;
};
class OrientationGizmo extends HTMLElement {
  easingFunction = new BABYLON.QuadraticEase();
  constructor(camera, options) {
    super();
    if (camera.getClassName() !== 'ArcRotateCamera') {
      throw 'supports ArcRotate camera only';
    }
    this.camera = camera;
    this.options = Object.assign(
      {
        size: 90,
        padding: 8,
        bubbleSizePrimary: 8,
        bubbleSizeSeconday: 6,
        showSecondary: true,
        lineWidth: 2,
        fontSize: '11px',
        fontFamily: 'arial',
        fontWeight: 'bold',
        fontColor: '#151515',
        fontYAdjust: 0,
        colors: {
          x: ['#f73c3c', '#942424'],
          y: ['#6ccb26', '#417a17'],
          z: ['#178cf0', '#0e5490'],
        },
      },
      options
    );

    // Generate list of axes
    this.bubbles = [
      {
        axis: 'x',
        direction: new BABYLON.Vector3(1, 0, 0),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.x,
        line: this.options.lineWidth,
        label: 'X',
      },
      {
        axis: 'y',
        direction: new BABYLON.Vector3(0, 1, 0),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.y,
        line: this.options.lineWidth,
        label: 'Y',
      },
      {
        axis: 'z',
        direction: new BABYLON.Vector3(0, 0, 1),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.z,
        line: this.options.lineWidth,
        label: 'Z',
      },
      {
        axis: '-x',
        direction: new BABYLON.Vector3(-1, 0, 0),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.x,
      },
      {
        axis: '-y',
        direction: new BABYLON.Vector3(0, -1, 0),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.y,
      },
      {
        axis: '-z',
        direction: new BABYLON.Vector3(0, 0, -1),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.z,
      },
    ];

    this.center = new BABYLON.Vector3(this.options.size / 2, this.options.size / 2, 0);
    this.selectedAxis = null;

    this.easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    this.innerHTML = `
        <canvas id='gizmoContainer' width=${this.options.size} height=${this.options.size} 
        style="
        border-radius: 60px;
        background-color: rgba(255, 255, 255, .15);
        ">
        </canvas>
        `;
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseClick = this.onMouseClick.bind(this);
  }

  connectedCallback() {
    this.canvas = this.querySelector('#gizmoContainer');
    this.context = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousemove', this.onMouseMove, false);
    this.canvas.addEventListener('mouseout', this.onMouseOut, false);
    this.canvas.addEventListener('click', this.onMouseClick, false);
  }

  disconnectedCallback() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove, false);
    this.canvas.removeEventListener('mouseout', this.onMouseOut, false);
    this.canvas.removeEventListener('click', this.onMouseClick, false);
  }

  onMouseMove(evt) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse = new BABYLON.Vector3(evt.clientX - rect.left, evt.clientY - rect.top, 0);
  }

  onMouseOut(_evt) {
    this.mouse = null;
  }

  onAxisSelected(selectedAxis) {
    console.log(selectedAxis);
    const vec = selectedAxis.direction.clone();
    vec.scaleInPlace(10);
    // const distance = BABYLON.Vector3.Distance(this.camera.position, this.camera.getFrontPosition(1))
    // // const distance = camera.position.distanceTo(orbit.target);
    // // vec.multiplyScalar(distance);
    // vec.scaleInPlace(distance)
    // console.log(this.camera.position)
    // const lookAt = BABYLON.Matrix.LookAtLH(
    //     this.camera.position,
    //     vec,
    //     BABYLON.Vector3.Up()
    // ).invert();
    // const rot = BABYLON.Quaternion.FromRotationMatrix( lookAt ).toEulerAngles();
    // console.log(rot)
    // this.camera.alpha = rot.x;
    // this.camera.beta = rot.y
    // this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, vec, 1);
    BABYLON.Animation.CreateAndStartAnimation(
      'orbitCam',
      this.camera,
      'position',
      10,
      5,
      this.camera.position,
      vec,
      0,
      this.easingFunction,
      null
    );
  }

  ontest() {}
  onMouseClick(_evt) {
    if (!this.selectedAxis) {
      return;
    }
    this.onAxisSelected({
      axis: this.selectedAxis.axis,
      direction: this.selectedAxis.direction.clone(),
    });
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCircle(p, radius = 10, color = '#FF0000') {
    this.context.beginPath();
    this.context.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.closePath();
  }

  drawLine(p1, p2, width = 1, color = '#FF0000') {
    this.context.beginPath();
    this.context.moveTo(p1.x, p1.y);
    this.context.lineTo(p2.x, p2.y);
    this.context.lineWidth = width;
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.closePath();
  }

  update() {
    this.clear();

    // Calculate the rotation matrix from the camera
    const rotMat = new BABYLON.Matrix();
    this.camera.absoluteRotation.toRotationMatrix(rotMat);
    const invRotMat = rotMat.clone().invert();

    for (var bubble of this.bubbles) {
      const invRotVec = BABYLON.Vector3.TransformCoordinates(bubble.direction.clone(), invRotMat);
      bubble.position = this.getBubblePosition(invRotVec);
    }

    // Generate a list of layers to draw
    const layers = [];
    for (const axis in this.bubbles) {
      // Check if the name starts with a negative and dont add it to the layer list if secondary axis is turned off
      if (this.options.showSecondary === true || axis[0] !== '-') {
        layers.push(this.bubbles[axis]);
      }
    }

    // Sort the layers where the +Z position is last so its drawn on top of anything below it
    layers.sort((a, b) => (a.position.z > b.position.z ? 1 : -1));

    // If the mouse is over the gizmo, find the closest axis and highlight it
    this.selectedAxis = null;

    if (this.mouse) {
      let closestDist = Infinity;

      // Loop through each layer
      for (var bubble of layers) {
        const distance = BABYLON.Vector3.Distance(this.mouse, bubble.position);

        // Only select the axis if its closer to the mouse than the previous or if its within its bubble circle
        if (distance < closestDist || distance < bubble.size) {
          closestDist = distance;
          this.selectedAxis = bubble;
        }
      }
    }

    // Draw the layers
    this.drawLayers(layers);
  }

  drawLayers(layers) {
    // For each layer, draw the bubble
    for (const bubble of layers) {
      let color = bubble.color;

      // Find the color
      if (this.selectedAxis === bubble) {
        color = '#FFFFFF';
      } else if (bubble.position.z >= -0.01) {
        color = bubble.color[0];
      } else {
        color = bubble.color[1];
      }

      // Draw the circle for the bubbble
      this.drawCircle(bubble.position, bubble.size, color);

      // Draw the line that connects it to the center if enabled
      if (bubble.line) {
        this.drawLine(this.center, bubble.position, bubble.line, color);
      }

      // Write the axis label (X,Y,Z) if provided
      if (bubble.label) {
        this.context.font = [
          this.options.fontWeight,
          this.options.fontSize,
          this.options.fontFamily,
        ].join(' ');
        this.context.fillStyle = this.options.fontColor;
        this.context.textBaseline = 'middle';
        this.context.textAlign = 'center';
        this.context.fillText(
          bubble.label,
          bubble.position.x,
          bubble.position.y + this.options.fontYAdjust
        );
      }
    }
  }

  getBubblePosition(position) {
    return new BABYLON.Vector3(
      position.x * (this.center.x - this.options.bubbleSizePrimary / 2 - this.options.padding) +
        this.center.x,
      this.center.y -
        position.y * (this.center.y - this.options.bubbleSizePrimary / 2 - this.options.padding),
      position.z
    );
  }
}
window.customElements.define(`orientation-gizmo${Math.random()}`, OrientationGizmo);
