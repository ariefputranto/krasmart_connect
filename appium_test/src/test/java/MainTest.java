import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.remote.DesiredCapabilities;

//from appcenter web
import com.microsoft.appcenter.appium.Factory;
import com.microsoft.appcenter.appium.EnhancedAndroidDriver;
import org.junit.rules.TestWatcher;
import org.junit.Rule;
import io.appium.java_client.MobileElement;

public class MainTest {
    @Rule
    public TestWatcher watcher = Factory.createWatcher();

    private static EnhancedAndroidDriver<MobileElement> driver;

    public static EnhancedAndroidDriver<MobileElement> startApp() throws MalformedURLException {
        System.out.println("Setting up capabilities");
        DesiredCapabilities capabilities = new DesiredCapabilities();

        capabilities.setCapability("platformName", "Android");
        capabilities.setCapability("automationName", "UiAutomator2");
        capabilities.setCapability("appPackage", "com.krasmartconnect");
        capabilities.setCapability("appActivity", "com.krasmartconnect.MainActivity");
        capabilities.setCapability("autoGrantPermissions", "true");


        URL url = new URL("http://0.0.0.0:4723/wd/hub");

        return Factory.createAndroidDriver(url, capabilities);
    }

    @After
    public void tearDown(){
        if (driver != null) {
            driver.label("Stopping App");
            driver.quit();
        }
    }

    @Test
    public void simpleTest() throws IOException, InterruptedException  {
        driver = startApp();
        System.out.println("Starting test");

        Thread.sleep(25000);
        driver.findElement(By.className("android.webkit.WebView"));
    }
}
