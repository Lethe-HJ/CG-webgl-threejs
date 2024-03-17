import * as THREE from "https://unpkg.com/three@0.135.0/build/three.module.js";

export class ConcaveGeometry extends THREE.BufferGeometry {
    constructor(positions, cells) {
        super();
        this.type = 'ConcaveGeometry';
        this.vertices = [];
        this.normals = [];
        this.renderGeometry(positions, cells);
    }

    renderGeometry(positions, cells) {
        cells.forEach((face) => {
            const [i1, i2, i3] = face;
            const triangle = new THREE.Triangle();
            const [c1, c2, c3] = [positions[i1], positions[i2], positions[i3]];
            const [p1, p2, p3] = [
                new THREE.Vector3().fromArray(c1),
                new THREE.Vector3().fromArray(c2),
                new THREE.Vector3().fromArray(c3)
            ];
            this.vertices.push(...c1, ...c2, ...c3);
            triangle.set(p1, p2, p3);
            let normal = new THREE.Vector3();
            triangle.getNormal(normal);
            normal = normal.toArray();
            this.normals.push(...normal, ...normal, ...normal);
        });
        this.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3));
        this.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    }
}
