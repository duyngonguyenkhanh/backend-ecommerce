module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        console.log(req.session);
        
        return res.status(400).json({message: "bạn chưa đăng nhập"});
    }
    next();
}