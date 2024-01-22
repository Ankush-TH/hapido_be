import express from "express";
import mysql from "mysql";
import cors from "cors";
import bcrypt, { hash } from "bcrypt";

const salt = 10;

const app = express();
const port = 8085;
app.use(express.json());
app.use(cors());

const dbConnect = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hapido",
});

dbConnect.connect((err) => {
  err ? console.warn(err) : console.log("Connected to db");
});

app.post("/register", (req, res) => {
  const sqlQuery = "INSERT INTO users (`email`, `password`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
    if (err)
      return res.json({
        status: false,
        message: "Error for hashing password",
        errDetails: err,
      });
    const values = [req.body.email, hash];
    dbConnect.query(sqlQuery, [values], (err, result) => {
      if (err)
        return res.json({
          status: false,
          message: "Inserting data error server",
          errDetails: err,
        });
      return res.json({ status: true, message: "Success" });
    });
  });
});

app.post("/login", (req, res) => {
  const sqlQuery = "SELECT * FROM users WHERE email = ?";
  dbConnect.query(sqlQuery, [req.body.email], (err, result) => {
    if (err)
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    if (result.length > 0)
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err)
            return res.json({
              status: false,
              message: "Something went wrong!",
              errDetails: err,
            });
          if (response) {
            return res.json({
              status: true,
              message: "Success",
              userDetails: result[0],
            });
          } else {
            return res.json({
              status: false,
              message: "Incorrect Password",
            });
          }
        }
      );
    else {
      return res.json({ status: false, message: "Email does not exists" });
    }
  });
});

app.get("/getMyCompany/:user_id", (req, res) => {
  const sqlQuery = "SELECT * FROM companies WHERE user_id = ?";
  const user_id = req?.params?.user_id;
  dbConnect.query(sqlQuery, [user_id], (err, result) => {
    if (err) {
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    }

    if (result.length > 0) {
      return res.json({
        status: true,
        message: "Success",
        details: result,
      });
    } else {
      return res.json({ status: false, message: "Company data not found" });
    }
  });
});

app.get("/getCompanies/:user_id/:comp_id", (req, res) => {
  const sqlQuery = "SELECT * FROM companies WHERE user_id != ?";
  const user_id = req?.params?.user_id;
  const comp_id = req?.params?.comp_id;
  dbConnect.query(sqlQuery, [user_id], (err, result) => {
    if (err) {
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    }

    if (result.length > 0) {
      return res.json({
        status: true,
        message: "Success",
        details: result,
      });
    } else {
      return res.json({ status: false, message: "Company data not found" });
    }
  });
});

app.get("/getCompanyConnection/:from_comp/:to_comp", (req, res) => {
  const sqlQuery =
    "SELECT * FROM connections WHERE from_comp = ? AND to_comp = ?";
  const from_comp = req?.params?.from_comp;
  const to_comp = req?.params?.to_comp;
  dbConnect.query(sqlQuery, [from_comp, to_comp], (err, result) => {
    if (err) {
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    }

    if (result.length > 0) {
      return res.json({
        status: true,
        message: "Success",
        details: result,
      });
    } else {
      return res.json({ status: false, message: "Data not found" });
    }
  });
});

app.get("/getReceivedRequests/:comp_id", (req, res) => {
  const sqlQuery =
    "SELECT companies.*, connections.status, connections.id AS `connection_id` FROM connections INNER JOIN companies ON connections.from_comp=companies.id WHERE connections.to_comp=?";
  const comp_id = req?.params?.comp_id;
  dbConnect.query(sqlQuery, [comp_id], (err, result) => {
    if (err) {
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    }

    if (result.length > 0) {
      return res.json({
        status: true,
        message: "Success",
        details: result,
      });
    } else {
      return res.json({ status: false, message: "Data not found" });
    }
  });
});

app.post("/requestCompany", (req, res) => {
  const sqlQuery = "INSERT INTO connections (`from_comp`,`to_comp`) VALUES (?)";
  const values = [req.body.from_comp, req.body.to_comp];
  dbConnect.query(sqlQuery, [values], (err, data) => {
    if (err)
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    return res.json({
      status: true,
      message: "Success",
      userDetails: data,
    });
  });
});

app.put("/updateRequest/:id", (req, res) => {
  const sqlQuery = "Update connections SET `status`=? WHERE id=?";
  const id = req?.params?.id;
  dbConnect.query(sqlQuery, [req.body.status, id], (err, data) => {
    if (err)
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });

    const sqlQuery3 = "SELECT * FROM connections WHERE id = ?";
    dbConnect.query(sqlQuery3, [id], (err, resp) => {
      if (err)
        return res.json({
          status: false,
          message: "Something went wrong!",
          errDetails: err,
        });

      return res.json({
        status: true,
        message: "Success",
        details: resp,
      });
    });
  });
});

app.post("/insertUpdateCompany", (req, res) => {
  const sqlQuery = "SELECT * FROM companies WHERE user_id = ?";
  dbConnect.query(sqlQuery, [req.body.user_id], (err, result) => {
    if (err) {
      return res.json({
        status: false,
        message: "Something went wrong!",
        errDetails: err,
      });
    }

    if (result.length > 0) {
      const sqlQuery1 =
        "Update companies SET name=?,size=?,type=?,industry=? WHERE user_id=?";
      const values = [
        req.body.name,
        req.body.size,
        req.body.type,
        req.body.industry,
      ];
      dbConnect.query(sqlQuery1, [...values, req.body.user_id], (err, data) => {
        if (err)
          return res.json({
            status: false,
            message: "Something went wrong!",
            errDetails: err,
          });

        const sqlQuery3 = "SELECT * FROM companies WHERE user_id = ?";
        dbConnect.query(sqlQuery3, [req.body.user_id], (err, resp) => {
          return res.json({
            status: true,
            message: "Success",
            userDetails: resp,
          });
        });
      });
    } else {
      const sqlQuery2 =
        "INSERT INTO companies (`user_id`,`name`,`size`,`type`,`industry`) VALUES (?)";
      const values = [
        req.body.user_id,
        req.body.name,
        req.body.size,
        req.body.type,
        req.body.industry,
      ];
      dbConnect.query(sqlQuery2, [values], (err, data) => {
        if (err)
          return res.json({
            status: false,
            message: "Something went wrong!",
            errDetails: err,
          });

        const sqlQuery4 = "SELECT * FROM companies WHERE user_id = ?";
        dbConnect.query(sqlQuery4, [req.body.user_id], (err, resp) => {
          return res.json({
            status: true,
            message: "Success",
            userDetails: resp,
          });
        });
      });
    }
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
