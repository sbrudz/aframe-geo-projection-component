/* global assert, setup, suite, test */
require('aframe');
require('../../index');
require('../../src/extrudeRenderer');

var entityFactory = require('../helpers').entityFactory;

var THREE = AFRAME.THREE;

var squareGeoJson = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]]
  }
};

suite('geo-extrude-renderer', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'geo-extrude-renderer') {
        return;
      }
      component = el.components['geo-extrude-renderer'];
      done();
    });
    el.setAttribute('geo-extrude-renderer', {});
  });

  suite('schema definition', function () {
    suite('isCCW property', function () {
      test('exists', function () {
        assert.property(component.data, 'isCCW');
      });
      test('defaults to false', function () {
        assert.propertyVal(component.data, 'isCCW', false);
      });
    });
    suite('extrudeAmount property', function () {
      test('exists', function () {
        assert.property(component.data, 'extrudeAmount');
      });
      test('defaults to 1', function () {
        assert.propertyVal(component.data, 'extrudeAmount', 1);
      });
    });
  });

  suite('dependencies', function () {
    suite('material', function () {
      test('can access a material defined on the entity', function () {
        el.setAttribute('material', {color: 'red'});
        var material = el.components.material.material;
        assert.instanceOf(material, THREE.Material, 'is an instance of Material');
        assert.propertyVal(material.color, 'r', 1);
        assert.propertyVal(material.color, 'g', 0);
        assert.propertyVal(material.color, 'b', 0);
      });
    });
    suite('geo-projection', function () {
      test('can access a geo-projection component defined on the entity', function () {
        el.setAttribute('geo-projection', {src: '/base/tests/assets/test.json'});
        var geoProjection = el.components['geo-projection'];
        assert.exists(geoProjection);
      });
    });
  });

  suite('#init', function () {
    test('connects to the geo-projection system', function () {
      assert.equal(component.system.name, 'geo-projection');
    });
    test('connects to the geo-projection component', function () {
      assert.equal(component.geoProjectionComponent.name, 'geo-projection');
    });
    test('listens for the geo-src-loaded event', function () {
      var object3D = component.el.getObject3D('extrudeMap');
      assert.notExists(object3D);

      component.geoProjectionComponent.geoJson = squareGeoJson;
      el.emit('geo-src-loaded');
      object3D = component.el.getObject3D('extrudeMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
  });

  suite('#update', function () {
    suite('when the geoProjectComponent has geoJson loaded', function () {
      suite('and the value of isCCW changes', function () {
        test('re-renders', function () {
          var object3D = component.el.getObject3D('extrudeMap');
          assert.isUndefined(object3D);

          component.geoProjectionComponent.geoJson = squareGeoJson;

          el.setAttribute('geo-extrude-renderer', { isCCW: true });

          object3D = component.el.getObject3D('extrudeMap');
          assert.instanceOf(object3D, THREE.Object3D);
        });
      });
      suite('and the value of extrudeAmount changes', function () {
        test('re-renders', function () {
          var object3D = component.el.getObject3D('extrudeMap');
          assert.isUndefined(object3D);

          component.geoProjectionComponent.geoJson = squareGeoJson;

          el.setAttribute('geo-extrude-renderer', { extrudeAmount: 2 });

          object3D = component.el.getObject3D('extrudeMap');
          assert.instanceOf(object3D, THREE.Object3D);
        });
      });
      suite('and the values of isCCW and extrudeAmount have not changed', function () {
        test('does not re-render', function () {
          var object3D = component.el.getObject3D('extrudeMap');
          assert.notExists(object3D);

          component.geoProjectionComponent.geoJson = squareGeoJson;

          el.setAttribute('geo-extrude-renderer', { isCCW: false, extrudeAmount: 1 });

          object3D = component.el.getObject3D('extrudeMap');
          assert.notExists(object3D);
        });
      });
    });
    suite('when the geoProjectComponent has no geoJson loaded', function () {
      test('does not render anything', function () {
        component.geoProjectionComponent.geoJson = null;
        component.update({});
        var object3D = component.el.getObject3D('extrudeMap');
        assert.notExists(object3D);
      });
    });
  });

  suite('#render', function () {
    test('sets an Object3D on the component', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('extrudeMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
    test('renders the output as a Mesh', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('extrudeMap');
      assert.instanceOf(object3D, THREE.Mesh);
    });
    test('renders the output with an ExtrudeBufferGeometry', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('extrudeMap');
      assert.instanceOf(object3D.geometry, THREE.ExtrudeBufferGeometry);
    });
    test('renders the output with the given material', function () {
      var expectedMaterial = el.components.material.material;
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('extrudeMap');
      assert.equal(object3D.material, expectedMaterial);
    });
  });

  suite('#remove', function () {
    test('removes the Object3D set on the component', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('extrudeMap');
      assert.isUndefined(object3D);
    });
    test('stops listening for the geo-src-loaded event', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('extrudeMap');
      assert.isUndefined(object3D);

      el.emit('geo-src-loaded');

      object3D = component.el.getObject3D('extrudeMap');
      assert.isUndefined(object3D);
    });
  });
});
