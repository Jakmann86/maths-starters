// A convex polygon drawn to its true interior angles.
//
// Walking round the polygon, the direction turns by each exterior angle
// (180 - interior) at each vertex, and the turns add to 360. Any side
// lengths along those directions keep the angles; only lengths that close
// the shape are wanted. Of all the closing lengths this takes the ones
// nearest to equal (least squares from all-ones), so the outline is as even
// as the angles allow.
//
// Vertex k sits between side k - 1 and side k, so its interior angle is
// interior[k]. Side 0 runs to the right and the walk turns clockwise on
// screen (SVG's y-down), so the polygon hangs below side 0.
//
// Pure: used by Figure.jsx to draw, and by generators and tests to reject
// angle sets whose closing lengths come out uneven (a sliver of a side).

const rad = (d) => (d * Math.PI) / 180;

export function polygonFromInteriorAngles(interior) {
  const n = interior.length;
  const ext = interior.map((a) => 180 - a);
  const dirs = [];
  let th = 0;
  for (let k = 0; k < n; k += 1) {
    if (k > 0) th += ext[k];
    dirs.push([Math.cos(rad(th)), Math.sin(rad(th))]);
  }
  // Lengths L = 1 - U^T λ with (U U^T) λ = U 1, which makes Σ L_k u_k = 0.
  let sx = 0, sy = 0, xx = 0, xy = 0, yy = 0;
  dirs.forEach(([ux, uy]) => {
    sx += ux; sy += uy; xx += ux * ux; xy += ux * uy; yy += uy * uy;
  });
  const det = xx * yy - xy * xy;
  const lx = (yy * sx - xy * sy) / det;
  const ly = (xx * sy - xy * sx) / det;
  const lengths = dirs.map(([ux, uy]) => 1 - (ux * lx + uy * ly));
  const verts = [[0, 0]];
  for (let k = 0; k < n - 1; k += 1) {
    const [px, py] = verts[k];
    verts.push([px + lengths[k] * dirs[k][0], py + lengths[k] * dirs[k][1]]);
  }
  return { verts, lengths };
}

/** True when no side comes out shorter than `min` of the longest. */
export const evenEnough = (interior, min = 0.35) => {
  const { lengths } = polygonFromInteriorAngles(interior);
  const longest = Math.max(...lengths);
  return lengths.every((l) => l >= min * longest);
};
