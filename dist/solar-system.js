/*
 * solar-system
 * @Description Solar System with Threejs
 * @version v0.1.39 - 2016-04-04
 * @link https://github.com/kdaimiel/solar-system#readme
 * @author Enrique Daimiel Ruiz <k.daimiel@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
THREE.SolarBody = function(bodyProperties) {

  THREE.Object3D.call( this );

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || null,
    map: arguments[2] || null,
    bumpMap: arguments[3] || null,
    specularMap: arguments[4] || null,
    orbitProperties: arguments[5] || null,
    cloudsProperties: arguments[6] || null,
    ringsProperties: arguments[7] || null
  }, bodyProperties);

  this.name = this.properties.name;
  this.type = this.properties.type;

  this.geometry = new THREE.Geometry();
  this.material = new THREE.MeshBasicMaterial();

  if(this.properties.map){
    this.texloader.load(this.properties.map, this.loadTexture.bind(this));
  }

  if(this.properties.bumpMap) {
    this.texloader.load(this.properties.bumpMap, this.loadbumpMap.bind(this));
  }

  if(this.properties.specularMap) {
    this.texloader.load(this.properties.specularMap, this.loadspecularMap.bind(this));
  }

  if(this.properties.orbitProperties){
    this.orbitProperties = this.properties.orbitProperties;
  }

  if(this.properties.cloudsProperties) {
    this.addClouds(this.properties.cloudsProperties);
  }

  if(this.properties.ringsProperties) {
    this.addRings(this.properties.ringsProperties);
  }

  this.updateMorphTargets();
};

THREE.SolarBody.prototype = Object.create( THREE.Mesh.prototype );
THREE.SolarBody.prototype.constructor = THREE.SolarBody;

THREE.SolarBody.prototype.addClouds = function(cloudsProperties) {
  this.add(new THREE.CloudsMesh(cloudsProperties));
};

THREE.SolarBody.prototype.addRings = function(ringsProperties) {
  this.add(new THREE.RingsMesh(ringsProperties));
};

THREE.SolarBody.prototype.addSatellite = function(satellite, orbitProperties) {
  var orbit = new THREE.OrbitMesh(orbitProperties);
  satellite.orbit = orbit;

  if(this.orbit){
    this.orbit.add(orbit);
    orbit.position.z = this.position.z || 0;
  } else {
    this.parent.add(orbit);
  }
  orbit.add(satellite);
  satellite.position.z = this.radius + orbit.distance + satellite.radius || 0;
};

THREE.SolarBody.prototype.loadTexture = function (map){
  this.material  = new THREE.MeshPhongMaterial({
    map: map,
    side: THREE.DoubleSide
  });
};

THREE.SolarBody.prototype.loadbumpMap = function(bumpMap) {
  this.material.bumpMap = bumpMap;
};

THREE.SolarBody.prototype.loadspecularMap = function(specularMap) {
  this.material.specularMap = specularMap;
};

THREE.SolarBody.prototype.update = function(camera) {
  this.rotation.y -= this.vRotation * Math.PI / 180;     // Rotates  N degrees per frame;
  for(var i in this.children) {
    this.children[i].update(camera, this);
  }
};

THREE.SolarBody.prototype.texloader = new THREE.TextureLoader();

THREE.PlanetMesh = function(planetProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'PlanetMesh',
    radius: arguments[2] || 50,
    tilt: arguments[3] || 0,
    vRotation: arguments[4] || 0
  }, planetProperties);

  THREE.SolarBody.call(this, this.properties);

  this.radius = this.properties.radius;
  this.rotation.x = this.properties.tilt;
  this.vRotation = this.properties.vRotation;

  this.geometry = new THREE.SphereGeometry(this.radius || 50, 100, 100);
};

THREE.PlanetMesh.prototype = Object.create( THREE.SolarBody.prototype );
THREE.PlanetMesh.prototype.constructor = THREE.PlanetMesh;

THREE.RingsGeometry = function (innerRadius, outerRadius, thetaStart, thetaLength, thetaSegments, phiSegments) {

  THREE.Geometry.call( this );

  this.type = 'RingsGeometry';

  this.innerRadius = innerRadius || 0;
  this.outerRadius = outerRadius || 50;

  this.thetaStart = thetaStart !== undefined ? thetaStart : 0;
  this.thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

  this.thetaSegments = thetaSegments !== undefined ? Math.max( 3, thetaSegments ) : 50;
  this.phiSegments = phiSegments !== undefined ? Math.max( 1, phiSegments ) : 50;

  var i, o, uvs = [], radius = this.innerRadius, radiusStep = ( ( outerRadius - innerRadius ) / this.phiSegments ), segment;
  for ( i = 0; i < this.phiSegments + 1; i ++ ) { // concentric circles inside ring
    for ( o = 0; o < this.thetaSegments + 1; o ++ ) { // number of segments per circle
      var vertex = new THREE.Vector3();
      segment = this.thetaStart + o / this.thetaSegments * this.thetaLength;
      vertex.x = radius * Math.cos( segment );
      vertex.y = radius * Math.sin( segment );

      this.vertices.push( vertex );
      uvs.push( new THREE.Vector2( i/(this.thetaSegments-1), o/ (this.phiSegments-1) ) );
    }
    radius += radiusStep;
  }

  var n = new THREE.Vector3( 0, 0, 1 );
  for ( i = 0; i < this.phiSegments; i ++ ) { // concentric circles inside ring
    var thetaSegment = i * (this.thetaSegments + 1);
    for ( o = 0; o < this.thetaSegments ; o ++ ) { // number of segments per circle
      segment = o + thetaSegment;
      var v1 = segment;
      var v2 = segment + this.thetaSegments + 1;
      var v3 = segment + this.thetaSegments + 2;

      this.faces.push( new THREE.Face3( v1, v2, v3, [ n.clone(), n.clone(), n.clone() ] ) );
      this.faceVertexUvs[ 0 ].push( [ uvs[ v1 ].clone(), uvs[ v2 ].clone(), uvs[ v3 ].clone() ]);

      v1 = segment;
      v2 = segment + this.thetaSegments + 2;
      v3 = segment + 1;

      this.faces.push( new THREE.Face3( v1, v2, v3, [ n.clone(), n.clone(), n.clone() ] ) );
      this.faceVertexUvs[ 0 ].push( [ uvs[ v1 ].clone(), uvs[ v2 ].clone(), uvs[ v3 ].clone() ]);
    }
  }

  this.computeFaceNormals();
  this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), radius );
};

THREE.RingsGeometry.prototype = Object.create( THREE.RingGeometry.prototype );
THREE.RingsGeometry.prototype.constructor = THREE.RingsGeometry;

/*require(['solar-system'], function three(SolarSystem) {
  SolarSystem.init();
  SolarSystem.loadObjectFronJSONFiles();
});*/

THREE.CloudsMesh = function(cloudProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'CloudsMesh',
    radius: arguments[2] || 20,
    opacity: arguments[3] || 0.5,
    transparent: arguments[4] || true,
    depthWrite: arguments[5] || false,
    speed: arguments[6] || 0.20, // The max speed of the clouds rotation
    map: arguments[7] || null,
    bumpMap: arguments[8] || null,
    specularMap: arguments[9] || null,
    orbitProperties: arguments[10] || null,
    cloudsProperties: arguments[11] || null,
    ringsProperties: arguments[12] || null
  }, cloudProperties);

  THREE.SolarBody.call(this, this.properties);

  this.radius = this.properties.radius;
  this.opacity = this.properties.opacity;
  this.transparent = this.properties.transparent;
  this.depthWrite = this.properties.depthWrite;
  this.speed = this.properties.speed;

  this.geometry   = new THREE.SphereGeometry(this.radius, 100, 100);
};

THREE.CloudsMesh.prototype = Object.create( THREE.SolarBody.prototype );
THREE.CloudsMesh.prototype.constructor = THREE.CloudsMesh;

THREE.CloudsMesh.prototype.loadTexture = function (map){
  this.material  = new THREE.MeshPhongMaterial({
    map: map,
    side: THREE.DoubleSide,
    opacity: this.opacity,
    transparent: this.transparent,
    depthWrite : this.depthWrite
  });
};

THREE.CloudsMesh.prototype.update = function() {
  // Clouds rote with random speed between 0.0 and speed (degrees).
  this.rotation.x -= THREE.Math.randFloat( 0.00, this.speed ) * Math.PI / 180;
  this.rotation.y -= THREE.Math.randFloat( 0.00, this.speed ) * Math.PI / 180;
};

THREE.MoonMesh = function(moonProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'MoonMesh',
    radius: arguments[2] || 50,
    tilt: arguments[3] || 0,
    vRotation: arguments[4] || 0,
    map: arguments[5] || null,
    bumpMap: arguments[6] || null,
    specularMap: arguments[7] || null,
    orbitProperties: arguments[8] || null,
    cloudsProperties: arguments[9] || null,
    ringsProperties: arguments[10] || null
  }, moonProperties);

  THREE.PlanetMesh.call(this, this.properties);
};

THREE.MoonMesh.prototype = Object.create( THREE.PlanetMesh.prototype );
THREE.MoonMesh.prototype.constructor = THREE.MoonMesh;

THREE.OrbitMesh = function(orbitProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'OrbitMesh',
    distance: arguments[2] || 50,
    speed: arguments[3] || 0,
    tilt: arguments[4] || 0
  }, orbitProperties);

  THREE.SolarBody.call(this, this.properties);

  this.distance = this.properties.distance;
  this.speed = this.properties.speed;
  this.tilt = this.properties.tilt;
};

THREE.OrbitMesh.prototype = Object.create( THREE.SolarBody.prototype );
THREE.OrbitMesh.prototype.constructor = THREE.OrbitMesh;

THREE.OrbitMesh.prototype.update = function() {
  this.rotation.y -= this.speed * Math.PI / 180 ;     // Rotates  N degrees per frame;
  for(var i in this.children) {
    this.children[i].update();
  }
};

THREE.RingsMesh = function(ringsProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'RingsMesh',
    tilt: arguments[2] || 0,
    vRotation: arguments[3] || 0,
    map: arguments[4] || null,
    bumpMap: arguments[5] || null,
    specularMap: arguments[6] || null,
    orbitProperties: arguments[7] || null,
    cloudsProperties: arguments[8] || null,
    ringsProperties: arguments[9] || null
  }, ringsProperties);

  THREE.SolarBody.call(this, this.properties);

  this.tilt = this.properties.tilt;
  this.rotation.x = (90 - (this.properties.tilt)) * Math.PI / 180;
  this.vRotation = this.properties.vRotation;
  this.geometry = new THREE.RingsGeometry(
    this.properties.innerRadius,
    this.properties.outerRadius,
    this.properties.thetaStart,
    this.properties.thetaLength,
    this.properties.thetaSegments,
    this.properties.phiSegments
  );

};

THREE.RingsMesh.prototype = Object.create( THREE.SolarBody.prototype );
THREE.RingsMesh.prototype.constructor = THREE.RingsMesh;

THREE.RingsMesh.prototype.update = function() {
  this.rotation.y -= this.vRotation * Math.PI / 180;     // Rotates N degrees per frame;
};

THREE.RingsMesh.prototype.loadTexture = function(map) {
  this.material = new THREE.MeshPhongMaterial({
      map: map,
      side: THREE.DoubleSide
    });
};

THREE.StarMesh = function(starProperties) {

  this.properties = _.extend({
    name: arguments[0] || null,
    type: arguments[1] || 'StarMesh',
    radius: arguments[2] || 50,
    tilt: arguments[3] || 0,
    vRotation: arguments[4] || 0,
    intesity: arguments[5] || 0.8,
    map: arguments[6] || null,
    bumpMap: arguments[7] || null,
    specularMap: arguments[8] || null,
    orbitProperties: arguments[9] || null,
    cloudsProperties: arguments[10] || null,
    ringsProperties: arguments[11] || null
  }, starProperties);

  THREE.SolarBody.call( this, this.properties );

  this.radius = this.properties.radius;
  this.rotation.x = this.properties.tilt;
  this.vRotation = this.properties.vRotation;
  this.intesity = this.properties.intensity;

  this.geometry = new THREE.SphereGeometry(this.radius || 50, 100, 100);

  // PointLight cannot cast shadow because of performance capacity.
  var light = new THREE.PointLight( 0xffffff, 1.5, 4500 );
  light.update = function(camera) {
    for(var i in light.children) {
      if(light.children[i].update) {
        light.children[i].update(camera);
      }
    }
  };
  this.add(light);

  this.createLensFlare();
};

THREE.StarMesh.prototype = Object.create( THREE.SolarBody.prototype );
THREE.StarMesh.prototype.constructor = THREE.StarMesh;

THREE.StarMesh.prototype.createLensFlare = function() {

  var size = this.radius * 2 * this.intesity;
  var flareColor = new THREE.Color( 0xffffff);
  var lensFlare = new THREE.LensFlare(flareColor );
  var texloader = new THREE.TextureLoader();

  texloader.load('img/sun/lensflare1.png', function(textureFlare) {
    lensFlare.add( textureFlare, size * 16, 0.0, THREE.AdditiveBlending );
  });
  texloader.load('img/sun/lensflare2.png', function(textureFlare) {
    lensFlare.add( textureFlare, size * 16, 0.0, THREE.AdditiveBlending );
  });
  texloader.load('img/sun/lensflare3.png', function(textureFlare) {
    lensFlare.add( textureFlare, size * 16, 0.0, THREE.AdditiveBlending );
  });
  texloader.load('img/sun/lensflare4.png', function(textureFlare) {
    lensFlare.add( textureFlare, size * 64, 0.0, THREE.AdditiveBlending );
  });

  lensFlare.position = this.position;

  //  This function will operate over each lensflare artifact, moving them around the screen
  lensFlare.update = function(camera, object) {
    if(camera) {
      var dist = camera.position.distanceTo(object.position);
      for(var i in this.lensFlares) {
        this.lensFlares[i].position = object.position;
        this.lensFlares[i].scale = this.lensFlares[i].size /  dist;
      }
    }

    this.updateLensFlares();
  };

  this.add(lensFlare);
  this.hasLensFlare = true;
};

THREE.StarMesh.prototype.loadTexture = function (map){
  this.material  = new THREE.MeshBasicMaterial({
    map: map,
    side: THREE.BackSide
  });
};

define('scene-builder', function() {

  'use strict';

  var scene, camera, renderer, controls, stats;
  var display;

  var factory = {
    addObject: addObject,
    animate : animate,
    setCamera: setCamera,
    setControls: setControls,
    init: init
  };

  return factory;

  function setCamera(newCamera) {
    camera = newCamera;
    //console.log('New camera has been placed in the scene');
  }

  function addObject(object) {
    scene.add(object);
    //console.log('New object of type "' + object.type + '"" has been added to the scene');
  }

  function setControls(newControls){
    controls = newControls;
    controls.addEventListener('change', render);
    //console.log('New controls have been added to the camera');
  }

  function render() {
    renderer.render(scene, camera);
  }

  function init(element) {
    scene = new THREE.Scene();
    display = element || null;

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(display.width || window.innerWidth , display.height || window.innerHeight);

    document.body.appendChild( renderer.domElement );

    // Set stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    // Catch
    window.addEventListener( 'resize', onWindowResize, false );

    //console.log('Scene initiated');
  }

  function animate() {

    if(!scene) {
      throw new TypeError('Scene has to be initiated before animate');
    }

    requestAnimationFrame( animate );

    for(var i in scene.children) {
      if(scene.children[i].update) {
        scene.children[i].update(camera);
      }
    }

    if(controls) {
      controls.update();
    }

    render();
    stats.update();
  }

  function onWindowResize() {
    camera.aspect = (display.width || window.innerWidth) / (display.height || window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize( display.width || window.innerWidth , display.height || window.innerHeight );

    controls.handleResize();
  }
});

define('scene-factory', function() {

  'use strict';

  var factory = {
    createCamera: createCamera,
    createControls: createControls,
    createLight: createLight,
    createMoon: createMoon,
    createPlanet: createPlanet,
    createStar: createStar
  };

  return factory;

  function createCamera(cameraProperties) {
    var camera;
    cameraProperties.aspect = cameraProperties.aspect || window.innerWidth / window.innerHeight;
    switch(cameraProperties.type) {
    case 'PerspectiveCamera':
      camera = new THREE.PerspectiveCamera(cameraProperties.fov, cameraProperties.aspect, cameraProperties.near, cameraProperties.far);
      break;
    case 'CubeCamera':
      camera = new THREE.CubeCamera(cameraProperties.near, cameraProperties.far , cameraProperties.cubeResolution);
      break;
    case 'OrthographicCamera':
      camera = new THREE.OrthographicCamera(cameraProperties.left, cameraProperties.right , cameraProperties.top,  cameraProperties.bottom, cameraProperties.near, cameraProperties.far);
      break;
    default:
      throw new TypeError(cameraProperties.type + ' is not a kind of valid camera');
    }

    if(cameraProperties.position) {
      camera.position.x = cameraProperties.position.x || 0;
      camera.position.y = cameraProperties.position.y || 0;
      camera.position.z = cameraProperties.position.z || 0;
    }

    camera.zoom = cameraProperties.zoom || 1;

    return camera;
  }

  function createControls(camera, controlsType) {
    var controls;
    switch(controlsType) {
    case 'TrackballControls':
      controls = new THREE.TrackballControls(camera);
      break;
    case 'DeviceOrientationControls':
      controls = new THREE.DeviceOrientationControls( camera );
      break;
    case 'FlyControls':
      controls = new THREE.FlyControls( camera );
      break;
    case 'OrbitControls':
      controls = new THREE.OrbitControls( camera );
      break;
    case 'PointerLockControls':
      controls = new THREE.PointerLockControls( camera );
      break;
    case 'TransformControls':
      controls = new THREE.TransformControls( camera );
      break;
    default:
      throw new TypeError(controlsType + ' is not a kind of valid camera controls');
    }
    return controls;
  }

  function createLight(lightProperties) {

    var light;

    var color = new THREE.Color(lightProperties.hexColor) || 0xffffff;
    switch(lightProperties.type) {
    case 'AmbientLight':
      light = new THREE.AmbientLight(color);
      break;
    case 'DirectionalLight':
      light = new THREE.DirectionalLight(color, lightProperties.intensity || 0.5);
      break;
    case 'HemisphereLight':
      light = new THREE.HemisphereLight(lightProperties.skyColor || 0xffffbb, lightProperties.groundColor || 0x080820, lightProperties.intensity || 1.0);
      break;
    case 'PointLight':
      light = new THREE.PointLight(color, lightProperties.intensity || 1.0, lightProperties.distance || 0.0, lightProperties.decay || 1.0);
      break;
    case 'SpotLight':
      light = new THREE.SpotLight(color, lightProperties.intensity || 1.0, lightProperties.distance || 0.0, lightProperties.angle || Math.PI/3, lightProperties.exponent || 10.0, lightProperties.decay || 1);
      light.onlyShadow = lightProperties.onlyShadow || false;
      light.castShadow = lightProperties.castShadow || false;
      light.shadowCameraNear = lightProperties.shadowCameraNear || 50;
      light.shadowCameraFar = lightProperties.shadowCameraFar || 5000;
      light.shadowCameraLeft = lightProperties.shadowCameraLeft || -500;
      light.shadowCameraRight = lightProperties.shadowCameraRight || 500;
      light.shadowCameraTop = lightProperties.shadowCameraTop || 500;
      light.shadowCameraBottom = lightProperties.shadowCameraBottom || -500;
      light.shadowCameraVisible = lightProperties.shadowCameraVisible || false;
      light.shadowBias = lightProperties.shadowBias || 0;
      light.shadowDarkness = lightProperties.shadowDarkness || 0.5;
      light.shadowMapWidth = lightProperties.shadowMapWidth || 512;
      light.shadowMapHeight = lightProperties.shadowMapHeight || 512;
      light.shadowMapSize = lightProperties.shadowMapSize;
      light.shadowCamera = lightProperties.shadowCamera;
      light.shadowMatrix = lightProperties.shadowMatrix;
      light.shadowMap = lightProperties.shadowMap;
      break;
    default:
      throw new TypeError(lightProperties.type + ' is not a kind of valid light');
    }

    if(lightProperties.position) {
      light.position.set(lightProperties.position.x || 0, lightProperties.position.y || 0, lightProperties.position.z || 0);
    }

    return light;
  }

  function createMoon(moonProperties) {
    var moon = new THREE.MoonMesh(moonProperties);
    return moon;
  }

  function createPlanet(planetProperties){
    var planet = new THREE.PlanetMesh(planetProperties);
    return planet;
  }

  function createStar(starProperties){
    var star = new THREE.StarMesh(starProperties);
    return star;
  }

});

define('solar-properties', function() {

  'use strict';

  var properties = {
    bodiesJSONProperties: '../src/data/bodies.properties.json',
    cameraJSONProperties: '../src/data/camera.properties.json',
    lightsJSONProperties: '../src/data/lights.properties.json'
  };

  return properties;
});

define('solar-service', function() {

  'use strict';

  var service = {
    getCamera: getCamera,
    getBodies: getBodies,
    getLights: getLights,
  };

  return service;

  function getCamera(cameraJSONProperties, callback){
    getJSON(cameraJSONProperties, callback);
  }

  function getBodies(bodiesJSONProperties, callback){
    getJSON(bodiesJSONProperties, callback);
  }

  function getLights(lightsJSONProperties, callback){
    getJSON(lightsJSONProperties, callback);
  }

  function getJSON(src, callback) {
    $.ajax(src, {
      success: function(data) {
        return callback(data);
      },
      error: function(err) {
        console.error('Load ' + src + ' error :' + err);
      }
    });
  }
});

define('solar-system', [
  'scene-builder',
  'scene-factory',
  'solar-service',
  'solar-properties'
], function(SceneBuilder, SceneFactory, SolarService, SolarProperties) {

  'use strict';

  var bodies = {};

  var solarSystem = {
    addMoon: addMoon,
    addPlanet: addPlanet,
    addStar: addStar,
    init: init,
    loadObjectFronJSONFiles: loadObjectFronJSONFiles
  };

  return solarSystem;

  function init(element) {
    SceneBuilder.init(element);
  }

  function addSolarBody(solarBody){
    bodies[solarBody.name] = solarBody;
    if(solarBody.orbitProperties) {
      bodies[solarBody.orbitProperties.round].addSatellite(solarBody, solarBody.orbitProperties);
    } else {
      SceneBuilder.addObject(solarBody);
    }
  }

  function addMoon(moonProperties) {
    var moon = SceneFactory.createMoon(moonProperties);
    addSolarBody(moon);
  }

  function addPlanet(planetProperties){
    var planet = SceneFactory.createPlanet(planetProperties);
    addSolarBody(planet);
  }

  function addStar(starProperties){
    var star = SceneFactory.createStar(starProperties);
    addSolarBody(star);
  }

  function loadObjectFronJSONFiles(){
    SolarService.getCamera(SolarProperties.cameraJSONProperties, loadCamera);
    SolarService.getBodies(SolarProperties.bodiesJSONProperties, loadBodies);
    SolarService.getLights(SolarProperties.lightsJSONProperties, loadLights);
  }

  function loadCamera(cameraProperties) {
    var camera = SceneFactory.createCamera(cameraProperties);
    SceneBuilder.setCamera(camera);

    var controls = SceneFactory.createControls(camera, cameraProperties.controls);
    SceneBuilder.setControls(controls);
    SceneBuilder.animate();
  }

  function loadBodies(bodiesProperties) {
    bodiesProperties.forEach(function(bodyProperties) {
      switch(bodyProperties.type) {
      case 'Star':
        addStar(bodyProperties);
        break;
      case 'Planet':
        addPlanet(bodyProperties);
        break;
      case 'Dwarf Planet':
        addPlanet(bodyProperties);
        break;
      case 'Moon':
        addMoon(bodyProperties);
        break;
      default:
        console.error(bodyProperties.type + ' is not considered a kind of solar body');
        return;
      }
    });
  }

  function loadLights(lightsProperties) {
    lightsProperties.forEach(function(lightProperties) {
      var light = SceneFactory.createLight(lightProperties);
      SceneBuilder.addObject(light);
    });
  }

});

/*define('solar-utils', function() {

  'use strict';

  var utils = {
    extend: extend
  };

  return utils;

  function extend(properties) {

  }

});
*/

require(['solar-system'], function three(SolarSystem) {

  // element registration
  Polymer({
    is: 'solar-system',
    properties: {
      width: {
        type: Number,
        value: window.innerWidth
      },
      height: {
        type: Number,
        value: window.innerHeight
      }
    },
    ready: function() {
      SolarSystem.init(this);
      SolarSystem.loadObjectFronJSONFiles();
    }
  });
});
