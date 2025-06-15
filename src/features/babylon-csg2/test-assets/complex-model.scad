// A complex model for end-to-end testing.
// It creates a base plate with a hole and an intersected shape on top.
union() {
    // Base plate with a hole
    difference() {
        // A flat box
        cube([30, 20, 5], center = true);
        // A cylinder punched through it
        cylinder(h = 10, r = 4, center = true);
    }

    // A shape on top, created from an intersection
    intersection() {
        sphere(r = 8);
        cube([10, 10, 10], center = true);
    }
}
