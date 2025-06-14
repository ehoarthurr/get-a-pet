const User = require("../models/User");

const bcrypt = require("bcrypt");

const createUserToken = require("../helpers/create-user-token");

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, phone, password, confirmPassword } = req.body;

    // validations
    const requiredFields = [
      { field: name, message: "O nome é obrigatório" },
      { field: email, message: "O e-mail é obrigatório" },
      { field: phone, message: "O telefone é obrigatório" },
      { field: password, message: "A senha é obrigatória" },
      {
        field: confirmPassword,
        message: "A confirmação de senha é obrigatória",
      },
    ];

    for (const { field, message } of requiredFields) {
      if (!field) {
        res.status(422).json({ message });
        return;
      }
    }

    if (password !== confirmPassword) {
      res.status(422).json({
        message: "A senha e a confirmação de senha precisam ser iguais!",
      });
    }

    // check if user exists
    const userExists = await User.findOne({ email: email });

    if (userExists) {
      res.status(422).json({
        message: "Por favor, utilize outro e-mail!",
      });
      return;
    }

    // create a password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // create a user
    const user = new User({
      name,
      email,
      phone,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();

      await createUserToken(newUser, req, res);
    } catch (error) {
      res.status(500).json({
        message: error,
      });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    const requiredFields = [
      { field: email, message: "O e-mail é obrigatório" },
      { field: password, message: "A senha é obrigatória" },
    ];

    for (const { field, message } of requiredFields) {
      if (!field) {
        res.status(422).json({ message });
        return;
      }
    }

    // check if user exists
    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(422).json({
        message: "Não há usuário cadastrado com esse e-mail!",
      });
      return;
    }

    // check if password matches with db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({
        message: "Senha inválida!",
      });
      return;
    }

    await createUserToken(user, req, res);
  }
};
