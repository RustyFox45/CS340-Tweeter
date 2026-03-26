import Login from "../../../../src/components/authentication/login/Login";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { instance, mock } from "@typestrong/ts-mockito";
import { LoginPresenter } from "../../../../src/presenter/LoginPresenter";
import { verify } from "@typestrong/ts-mockito";

library.add(fab);

describe("Login", () => {
    it("starts with the sign in button disabled", () => {
        const { signInButton } = renderLoginAndGetElements("/");
        expect(signInButton).toBeDisabled();
    });

    it("enables the sign in button when both alias and password fields are filled", async () => {
        const { user, signInButton, aliasField, passwordField } = renderLoginAndGetElements("/");

        await user.type(aliasField, "testuser");
        await user.type(passwordField, "password");

        expect(signInButton).toBeEnabled();
    });

    it("disables the sign in button when either alias or password field is empty", async () => {
        const { user, signInButton, aliasField, passwordField } = renderLoginAndGetElements("/");

        await user.type(aliasField, "testuser");
        await user.type(passwordField, "password");
        expect(signInButton).toBeEnabled();

        await user.clear(aliasField);
        expect(signInButton).toBeDisabled();

        await user.type(aliasField, "testuser");
        expect(signInButton).toBeEnabled();

        await user.clear(passwordField);
        expect(signInButton).toBeDisabled();
    });

    it ("calls the presenter's login method with correct parameters when the sign in button is pressed", async () => {
        const mockPresenter = mock<LoginPresenter>();
        const mockPresenterInstance = instance(mockPresenter);

        const originalUrl = "/some-protected-page";
        const testAlias = "testuser";
        const testPassword = "password";

        const { user, signInButton, aliasField, passwordField } = renderLoginAndGetElements(originalUrl, mockPresenterInstance);

        await user.type(aliasField, testAlias);
        await user.type(passwordField, testPassword);
        await user.click(signInButton);

        verify(mockPresenter.doLogin(testAlias, testPassword, originalUrl)).once();
    });

});

function renderLogin(originalUrl?: string, presenter?: LoginPresenter) {
    return render(
        <MemoryRouter>
            {!!presenter ? (
                <Login originalUrl={originalUrl} presenter={presenter} />
            ) : (
                <Login originalUrl={originalUrl} />
            )}
        </MemoryRouter>
    );
}

function renderLoginAndGetElements(originalUrl: string, presenter?: LoginPresenter) {
    const user = userEvent.setup();

    renderLogin(originalUrl, presenter);

    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    const aliasField = screen.getByLabelText(/Alias/i);
    const passwordField = screen.getByLabelText(/Password/i);

    return { user, signInButton, aliasField, passwordField };
}