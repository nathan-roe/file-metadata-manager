import React from 'react';
import {ActionIcon, Card, Group, Menu, Text, useMantineColorScheme} from "@mantine/core";
import {IconLanguage, IconMoonFilled, IconPhotoSearch, IconSunHigh} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";

const Header = () => {
    const {t, i18n} = useTranslation();
    const { setColorScheme, colorScheme } = useMantineColorScheme();

    return (
        <Card withBorder>
            <Group w="100%" h={20} px={20} justify="space-between" align="center">
                <Group w="fit-content" h="100%" align="center">
                    <IconPhotoSearch />
                    <Text size="sm" fw="bold">{t("header")}</Text>
                </Group>
                <Group w="fit-content" h="100%" align="center">
                    <Menu>
                        <Menu.Target>
                            <ActionIcon variant="transparent">
                                <IconLanguage />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item onClick={() => i18n.changeLanguage("en")}>
                                English
                            </Menu.Item>
                            <Menu.Item onClick={() => i18n.changeLanguage("es")}>
                                Spanish
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                    <ActionIcon variant="transparent" onClick={() => setColorScheme(colorScheme === "light" ? "dark" : "light")}>
                        {colorScheme === "light" ? <IconMoonFilled /> : <IconSunHigh />}
                    </ActionIcon>
                </Group>
            </Group>
        </Card>
    );
}

export default Header;