// util/mw.js
export const mustBeNumericId = (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: "Not found" });
  next();
};
