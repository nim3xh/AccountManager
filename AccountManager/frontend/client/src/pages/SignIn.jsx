import { Alert, Button, Label, Spinner, TextInput } from "flowbite-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BaseURL = import.meta.env.VITE_BASE_URL;

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  
   const handleChange = (e) => {
     const { id, value } = e.target;
     if (id === "email") setEmail(value.trim());
     else if (id === "password") setPassword(value.trim());
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading when the submit starts
    setErrorMessage(""); // Reset the error message before a new submission

    try {
      const response = await fetch(`${BaseURL}auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are included in requests
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful sign-in
        console.log("User signed in successfully"); // You can also log user data if needed
        localStorage.setItem("access", data.token);
        console.log(localStorage);
        navigate("/dashboard"); // Navigate to the dashboard after successful login
      } else {
        // Handle errors (e.g., invalid credentials)
        setErrorMessage(data.message || "Login failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Error during login:", error);
    } finally {
      setLoading(false); // Stop loading when the request is finished
    }
  };

  return (
    <div className="min-h-screen mt-20">
      <div className="flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5">
        {/* left */}
        <div className="flex-1">
          <Link to="/" className="font-bold dark:text-white text-4xl">
            <span className="px-2 py-1 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 rounded-lg text-white">
              technests's
            </span>
            <br />
            Account Manager
          </Link>
          <p className="text-sm mt-5">
            Welcome to technests's Account Manager.
          </p>
        </div>
        {/* right */}

        <div className="flex-1">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label value="Your email" />
              <TextInput
                type="email"
                placeholder="name@company.com"
                id="email"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label value="Your password" />
              <TextInput
                type="password"
                placeholder="Password"
                id="password"
                onChange={handleChange}
              />
            </div>
            <Button gradientMonochrome="teal" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="pl-3">Loading...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          {errorMessage && (
            <Alert className="mt-5" color="failure">
              {errorMessage}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
