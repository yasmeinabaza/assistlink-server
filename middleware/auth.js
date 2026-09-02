// Check if user is admin
export default function adminAuth(req, res, next) {
  const role = req.headers["x-role"];
  
  if (role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
}

// Check if user is care center staff
export function careCenterAuth(req, res, next) {
  const role = req.headers["x-role"];
  
  if (role === "care-center" || role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Care center access only" });
  }
}

// Check if user is engineer
export function engineerAuth(req, res, next) {
  const role = req.headers["x-role"];
  
  if (role === "engineer" || role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Engineer access only" });
  }
}