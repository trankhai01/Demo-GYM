function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', { 
            message: 'Bạn không có quyền truy cập trang này.' 
        });
    }
    next();
}

function requireStaff(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    const role = req.session.user.role;
    if (role !== 'admin' && role !== 'staff') {
        return res.status(403).render('error', { 
            message: 'Bạn không có quyền truy cập trang này.' 
        });
    }
    next();
}

function requireMember(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role.trim().toLowerCase() !== 'member') {
        return res.redirect('/');
    }
    next();
}

module.exports = { requireLogin, requireStaff, requireAdmin, requireMember };